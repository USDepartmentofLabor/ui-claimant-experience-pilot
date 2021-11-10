# -*- coding: utf-8 -*-
from django.test import TestCase, RequestFactory
from jwcrypto import jwt, jws, jwk
from jwcrypto.common import json_decode, json_encode
import logging
from core.test_utils import generate_auth_token, generate_keypair
from api.test_utils import create_swa
from api.models import SWA
from .middleware.jwt_authorizer import JwtAuthorizer

logger = logging.getLogger("swa.tests")


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
        swa, private_key_jwk = create_swa()
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()
        header_token = generate_auth_token(private_key_jwk, swa.code)
        request = request_with_token(header_token)
        authorizer = JwtAuthorizer(request)
        self.assertTrue(authorizer.authorized)

    def test_missing_header(self):
        request = RequestFactory().get("/swa/")
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "DEBUG:swa.middleware.jwt_authorizer:Missing Authorization header",
                cm.output,
            )

    def test_invalid_header(self):
        request = RequestFactory().get("/swa/", HTTP_AUTHORIZATION="foo")
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Invalid Authorization header",
                cm.output,
            )

    def test_different_header_type(self):
        request = RequestFactory().get("/swa/", HTTP_AUTHORIZATION="Bearer foobar")
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "DEBUG:swa.middleware.jwt_authorizer:Skipping Bearer method", cm.output
            )

    def test_invalid_token(self):
        swa, private_key_jwk = create_swa()
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()
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
        claims["iat"] = claims["iat"] - 10
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Claimed time outside of tolerance",
                cm.output,
            )

        # iat too late
        claims = unpack_token(token, swa)
        claims["iat"] = claims["iat"] + 10
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Claimed time outside of tolerance",
                cm.output,
            )

        # wrong alg
        sym_key = jwk.JWK(generate="oct", size=256)
        claims = unpack_token(token, swa)
        invalid_token = pack_token(
            claims, sym_key, alg="HS256", kid=swa.public_key_fingerprint
        )
        request = request_with_token(invalid_token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:jwt.exceptions.InvalidAlgorithmError",
                cm.output,
            )

    def test_invalid_swa(self):
        swa, private_key_jwk = create_swa()
        token = generate_auth_token(private_key_jwk, swa.code)

        # iss unknown
        claims = unpack_token(token, swa)
        claims["iss"] = "someone else"
        invalid_token = pack_token(claims, private_key_jwk)
        request = request_with_token(invalid_token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Invalid iss value: someone else",
                cm.output,
            )

        # iss inactive (create_swa is inactive by default)
        request = request_with_token(token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Invalid iss value: {}".format(
                    swa.code
                ),
                cm.output,
            )

    def test_invalid_key_fingerprint(self):
        swa, private_key_jwk = create_swa()
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key_fingerprint = "something changed"
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()

        request = request_with_token(token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:Key fingerprints do not match for {}".format(
                    swa.code
                ),
                cm.output,
            )

    def test_invalid_signature(self):
        _, diff_public_key_jwk = generate_keypair()
        swa, private_key_jwk = create_swa()
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key = diff_public_key_jwk.export_to_pem().decode("utf-8")
        # do not change fingerprint, just so we pass that check.
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()

        request = request_with_token(token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:jwt.exceptions.InvalidSignatureError",
                cm.output,
            )

    def test_invalid_nonce(self):
        swa, private_key_jwk = create_swa()
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()

        request = request_with_token(token)
        with self.assertLogs(level="DEBUG") as cm:
            authorizer = JwtAuthorizer(request)
            self.assertTrue(authorizer.authorized)
            authorizer = JwtAuthorizer(request)  # again, replay
            self.assertFalse(authorizer.authorized)
            self.assertIn(
                "ERROR:swa.middleware.jwt_authorizer:nonce already used", cm.output
            )


class SwaTestCase(TestCase):
    def test_client_auth_ok(self):
        swa, private_key_jwk = create_swa()
        swa.status = SWA.StatusOptions.ACTIVE
        swa.save()
        header_token = generate_auth_token(private_key_jwk, swa.code)
        resp = self.client.get("/swa/", HTTP_AUTHORIZATION=format_jwt(header_token))
        self.assertContains(resp, "hello world")
        self.assertEqual(resp.status_code, 200)

    def test_client_auth_denied(self):
        swa, private_key_jwk = create_swa()
        header_token = generate_auth_token(private_key_jwk, swa.code)
        resp = self.client.get("/swa/", HTTP_AUTHORIZATION=format_jwt(header_token))
        self.assertEqual(resp.status_code, 401)
