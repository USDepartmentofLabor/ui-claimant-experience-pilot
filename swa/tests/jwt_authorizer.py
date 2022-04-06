# -*- coding: utf-8 -*-
from django.test import TestCase, RequestFactory
from jwcrypto import jwt, jws, jwk
from jwcrypto.common import json_decode, json_encode
import logging
from core.test_utils import (
    generate_auth_token,
    generate_keypair,
)
from api.test_utils import create_swa
from swa.middleware.jwt_authorizer import JwtAuthorizer, JwtError

logger = logging.getLogger(__name__)


def format_jwt(token):
    return f"JWT {token}"


def unpack_token(token, swa):
    jwstoken = jws.JWS()
    jwstoken.deserialize(token)
    jwstoken.verify(swa.public_key_as_jwk())
    return json_decode(jwstoken.payload)


def pack_token(claims, private_key_jwk, alg="ES256", kid=None):
    if kid is None:
        kid = private_key_jwk.thumbprint()
    headers = json_encode(
        {
            "alg": alg,
            "kid": kid,
        }
    )
    token = jwt.JWT(header=headers, claims=claims, algs=[alg])
    token.make_signed_token(private_key_jwk)
    return token.serialize()


def request_with_token(token):
    return RequestFactory().get("/swa/", HTTP_AUTHORIZATION=format_jwt(token))


class JwtAuthorizerTestCase(TestCase):
    def test_happy_path(self):
        swa, private_key_jwk = create_swa(True)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        request = request_with_token(header_token)
        authorizer = JwtAuthorizer(request)
        self.assertTrue(authorizer.authorized)

    def test_missing_header(self):
        request = RequestFactory().get("/swa/")
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Missing Authorization header", str(context.exception))

    def test_invalid_header(self):
        request = RequestFactory().get("/swa/", HTTP_AUTHORIZATION="foo")
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Invalid Authorization header", str(context.exception))

    def test_different_header_type(self):
        request = RequestFactory().get("/swa/", HTTP_AUTHORIZATION="Bearer foobar")
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "DEBUG:swa.middleware.jwt_authorizer:Skipping Bearer method", cm.output
            )

    def test_invalid_token(self):
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)

        for claim in ["iat", "iss", "nonce"]:
            claims = unpack_token(token, swa)
            del claims[claim]
            invalid_token = pack_token(claims, private_key_jwk)
            request = request_with_token(invalid_token)
            with self.assertLogs(level="DEBUG") as cm:
                authorizer = JwtAuthorizer(request)
                self.assertFalse(authorizer.authorized)
                self.assertIn(
                    f'ERROR:swa.middleware.jwt_authorizer:Token is missing the "{claim}" claim',
                    cm.output,
                )

        # iat too early
        claims = unpack_token(token, swa)
        claims["iat"] = claims["iat"] - 60
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Claimed time outside of tolerance", str(context.exception))

        # iat too late
        claims = unpack_token(token, swa)
        claims["iat"] = claims["iat"] + 60
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Claimed time outside of tolerance", str(context.exception))

        # wrong alg
        sym_key = jwk.JWK(generate="oct", size=256)
        claims = unpack_token(token, swa)
        invalid_token = pack_token(
            claims, sym_key, alg="HS256", kid=swa.public_key_fingerprint
        )
        request = request_with_token(invalid_token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("InvalidAlgorithmError", str(context.exception))

    def test_invalid_swa(self):
        swa, private_key_jwk = create_swa()
        token = generate_auth_token(private_key_jwk, swa.code)

        # iss unknown
        claims = unpack_token(token, swa)
        claims["iss"] = "someone else"
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Invalid iss value: someone else", str(context.exception))

        # iss inactive (create_swa is inactive by default)
        request = request_with_token(token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("Invalid iss value: {}".format(swa.code), str(context.exception))

    def test_invalid_key_fingerprint(self):
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key_fingerprint = "something changed"
        swa.save()

        request = request_with_token(token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn(
            "Key fingerprints do not match for {}".format(swa.code),
            str(context.exception),
        )

    def test_invalid_signature(self):
        _, diff_public_key_jwk = generate_keypair()
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key = diff_public_key_jwk.export_to_pem().decode("utf-8")
        # do not change fingerprint, just so we pass that check.
        swa.save()

        request = request_with_token(token)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)
        self.assertIn("jwt.exceptions.InvalidSignatureError", str(context.exception))

    def test_invalid_nonce(self):
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
        request = request_with_token(token)
        authorizer = JwtAuthorizer(request)
        self.assertTrue(authorizer.authorized)
        with self.assertRaises(JwtError) as context:
            JwtAuthorizer(request)  # again, replay
        self.assertIn("nonce already used", str(context.exception))
