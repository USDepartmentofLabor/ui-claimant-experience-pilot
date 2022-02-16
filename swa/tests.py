# -*- coding: utf-8 -*-
from django.test import TestCase, RequestFactory
from django.conf import settings
from unittest.mock import MagicMock, patch
from jwcrypto import jwt, jws, jwk
from jwcrypto.common import json_decode, json_encode, base64url_encode, base64url_decode
import logging
from core.test_utils import (
    generate_auth_token,
    generate_keypair,
    create_s3_bucket,
    delete_s3_bucket,
)
from core.claim_storage import ClaimWriter, ClaimReader
from api.test_utils import create_swa, create_idp, create_claimant
from api.models import Claim
from .middleware.jwt_authorizer import JwtAuthorizer
from .claimant_1099G_uploader import Claimant1099GUploader
from core.claim_encryption import (
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
import uuid

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
        swa, private_key_jwk = create_swa(True)
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
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key_fingerprint = "something changed"
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
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
        swa.public_key = diff_public_key_jwk.export_to_pem().decode("utf-8")
        # do not change fingerprint, just so we pass that check.
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
        swa, private_key_jwk = create_swa(True)
        token = generate_auth_token(private_key_jwk, swa.code)
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
    maxDiff = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def test_client_auth_ok(self):
        swa, private_key_jwk = create_swa(True)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        resp = self.client.get("/swa/", HTTP_AUTHORIZATION=format_jwt(header_token))
        self.assertContains(resp, "hello world")
        self.assertEqual(resp.status_code, 200)

    def test_client_auth_denied(self):
        swa, private_key_jwk = create_swa()
        header_token = generate_auth_token(private_key_jwk, swa.code)
        resp = self.client.get("/swa/", HTTP_AUTHORIZATION=format_jwt(header_token))
        self.assertEqual(resp.status_code, 401)

    def test_client_PATCH_v1_claim_resolved(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)

        # success
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"resolved": "my reason"},
        )
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(claim.is_resolved())

        # no reason
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"resolved": None},
        )
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(claim.is_resolved())

        # error saving
        with patch("api.models.Claim.objects") as mocked_objects:
            mocked_claim = MagicMock(spec=Claim, name="mocked_claim")
            mocked_claim.swa = swa
            mocked_claim.events.create.side_effect = Exception("db error!")
            mocked_objects.get.return_value = mocked_claim
            header_token = generate_auth_token(private_key_jwk, swa.code)
            with self.assertLogs(level="DEBUG") as cm:
                response = self.client.patch(
                    f"/swa/v1/claims/{claim.uuid}/",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=format_jwt(header_token),
                    data={"resolved": "my reason"},
                )
                self.assertEqual(
                    response.json(),
                    {"status": "error", "error": "failed to save change"},
                )
                self.assertEqual(response.status_code, 500)
                # the -2 means our logging exception is the 2nd to last in the list
                self.assertIn("ERROR:swa.views:db error!", cm.output[-2])

    def test_client_DELETE_v1_claim(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)
        cw = ClaimWriter(claim, "test")
        cw.write()
        logger.debug("🚀 wrote claim")

        # success
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.delete(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
        )
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.status_code, 200)

        self.assertTrue(claim.is_deleted())

        # a 2nd call is a noop (idempotent)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.delete(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
        )
        self.assertEqual(response.json(), {"status": "noop"})
        self.assertEqual(response.status_code, 404)

        # error saving
        with patch("api.models.Claim.objects") as mocked_objects:
            mocked_claim = MagicMock(spec=Claim, name="mocked_claim")
            mocked_claim.swa = swa
            mocked_claim.delete_artifacts.side_effect = Exception("db error!")
            mocked_objects.get.return_value = mocked_claim
            header_token = generate_auth_token(private_key_jwk, swa.code)
            with self.assertLogs(level="DEBUG") as cm:
                response = self.client.delete(
                    f"/swa/v1/claims/{claim.uuid}/",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=format_jwt(header_token),
                )
                self.assertEqual(
                    response.json(),
                    {"status": "error", "error": "failed to delete artifacts"},
                )
                self.assertEqual(response.status_code, 500)
                # the -2 means our logging exception is the 2nd to last in the list
                self.assertIn("ERROR:swa.views:db error!", cm.output[-2])

    def test_client_PATCH_v1_claim_status(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"status": "new status"},
        )
        self.assertEqual(response.json(), {"status": "ok"})
        self.assertEqual(response.status_code, 200)

        # invalid uuid
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            "/swa/v1/claims/not-a-uuid/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"status": "new status"},
        )
        self.assertEqual(
            response.json(), {"status": "error", "error": "invalid claim id format"}
        )
        self.assertEqual(response.status_code, 400)

        # no such claim
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{uuid.uuid4()}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"status": "new status"},
        )
        self.assertEqual(
            response.json(), {"status": "error", "error": "invalid claim id"}
        )
        self.assertEqual(response.status_code, 404)

        # bad payload
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={},
        )
        self.assertEqual(
            response.json(),
            {"status": "error", "error": "only one value expected in payload"},
        )
        self.assertEqual(response.status_code, 400)

        # unknown action
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"foo": "bar"},
        )
        self.assertEqual(
            response.json(), {"status": "error", "error": "unknown action"}
        )
        self.assertEqual(response.status_code, 400)

        # different SWA owner
        swa2, swa2_private_key_jwk = create_swa(True, "AA")
        header_token = generate_auth_token(swa2_private_key_jwk, swa2.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"status": "new status"},
        )
        self.assertEqual(
            response.json(), {"status": "error", "error": "permission denied"}
        )
        self.assertEqual(response.status_code, 401)

        # error saving
        with patch("api.models.Claim.objects") as mocked_objects:
            mocked_claim = MagicMock(spec=Claim, name="mocked_claim")
            mocked_claim.swa = swa
            mocked_claim.change_status.side_effect = Exception("db error!")
            mocked_objects.get.return_value = mocked_claim
            header_token = generate_auth_token(private_key_jwk, swa.code)
            with self.assertLogs(level="DEBUG") as cm:
                response = self.client.patch(
                    f"/swa/v1/claims/{claim.uuid}/",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=format_jwt(header_token),
                    data={"status": "new status"},
                )
                self.assertEqual(
                    response.json(),
                    {"status": "error", "error": "failed to save change"},
                )
                self.assertEqual(response.status_code, 500)
                # the -2 means our logging exception is the 2nd to last in the list
                self.assertIn("ERROR:swa.views:db error!", cm.output[-2])

    def test_client_GET_v1_claims(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        # first request is empty because no matching events
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        self.assertEqual(
            response.json(), {"total_claims": 0, "next": None, "claims": []}
        )

        # second has 1 claim
        claim.events.create(category=Claim.EventCategories.COMPLETED)
        cw = ClaimWriter(claim, json_encode({"hello": "world"}))
        cw.write()

        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        self.assertEqual(
            response.json(),
            {"total_claims": 1, "next": None, "claims": [{"hello": "world"}]},
        )

        # third back to zero
        claim.events.create(category=Claim.EventCategories.FETCHED)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        self.assertEqual(
            response.json(), {"total_claims": 0, "next": None, "claims": []}
        )

        # pagination
        # payloads will be in order by created_at so this exercises our default sorting too.
        claim_payloads = []
        for loop in range(11):
            claim = Claim(claimant=claimant, swa=swa)
            claim.save()
            claim.events.create(category=Claim.EventCategories.COMPLETED)
            payload = {"doc": loop}
            cw = ClaimWriter(claim, json_encode(payload))
            cw.write()
            claim_payloads.append(payload)

        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        claim_payloads_page_1 = claim_payloads[0:10]
        claim_payloads_page_2 = claim_payloads[10:]
        self.assertEqual(
            response.json(),
            {
                "total_claims": 11,
                "next": "https://sandbox.ui.dol.gov:4430/swa/claims/?page=2",
                "claims": claim_payloads_page_1,
            },
        )
        self.assertEqual(len(response.json()["claims"]), 10)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/?page=2", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        self.assertEqual(
            response.json(),
            {"total_claims": 11, "next": None, "claims": claim_payloads_page_2},
        )
        self.assertEqual(len(response.json()["claims"]), 1)

        # mark all as fetched
        for claim in swa.claim_queue().all():
            claim.events.create(category=Claim.EventCategories.FETCHED)

        # error when Claim asset is missing
        claim_with_no_payload = Claim(swa=swa, claimant=claimant)
        claim_with_no_payload.save()
        claim_with_no_payload.events.create(category=Claim.EventCategories.COMPLETED)
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            "/swa/v1/claims/", HTTP_AUTHORIZATION=format_jwt(header_token)
        )
        self.assertEqual(
            response.json(),
            {
                "total_claims": 1,
                "next": None,
                "claims": [{"error": f"claim {claim_with_no_payload.uuid} missing"}],
            },
        )

    def test_v1_act_on_claim_GET_details(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa, status="excellent")
        claim.save()

        claim.events.create(category=Claim.EventCategories.STORED)
        claim.events.create(category=Claim.EventCategories.SUBMITTED)

        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.get(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
        )
        expected_events = claim.public_events()

        expected_response = {
            "id": str(claim.uuid),
            "swa_xid": None,
            "created_at": str(claim.created_at),
            "updated_at": str(claim.updated_at),
            "claimant_id": claimant.id,
            "events": expected_events,
            "status": claim.status,
        }
        self.assertEqual(response.json(), expected_response)

    def test_v1_POST_1099G(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)

        # happy path
        header_token = generate_auth_token(private_key_jwk, swa.code)
        example_1099G_file = settings.BASE_DIR / "swa" / "f1099g-recipient-example.pdf"
        with open(example_1099G_file, "rb") as fh:
            file_bytes = fh.read()
        response = self.client.post(
            f"/swa/v1/claimants/{claimant.idp_user_xid}/1099G/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={
                "file": base64url_encode(file_bytes),
                "filename": "path/to/f1099g-recipient-example.pdf",
                "year": "2022",
            },
        )
        self.assertEqual(response.status_code, 200)

        claimant_file = claimant.claimantfile_set.last()
        self.assertEqual(
            response.json(), {"status": "ok", "1099G": str(claimant_file.uuid)}
        )
        claim_reader = ClaimReader(claimant_file)
        encrypted_claimant_file = claim_reader.read()
        cd = SymmetricClaimDecryptor(
            encrypted_claimant_file, symmetric_encryption_key()
        )
        decrypted_claimant_file = cd.decrypt()
        decoded_file = base64url_decode(decrypted_claimant_file["file"])
        self.assertEqual(decoded_file, file_bytes)

        # bad request - just one missing param here, we test the Uploader class indepedently.
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.post(
            f"/swa/v1/claimants/{claimant.idp_user_xid}/1099G/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={
                "filename": "path/to/f1099g-recipient-example.pdf",
                "year": "2022",
            },
        )
        self.assertEqual(response.status_code, 400)

        # no such claimant
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.post(
            "/swa/v1/claimants/no-such-claimant/1099G/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={
                "filename": "path/to/f1099g-recipient-example.pdf",
                "year": "2022",
            },
        )
        self.assertEqual(response.status_code, 404)

        # error saving
        with patch("swa.views.Claimant1099GUploader") as mocked_uploader_class:
            mocked_uploader = MagicMock()
            mocked_uploader.save.return_value = False
            mocked_uploader.invalid = False
            mocked_uploader.error = "oops!"
            mocked_uploader_class.return_value = mocked_uploader
            header_token = generate_auth_token(private_key_jwk, swa.code)
            response = self.client.post(
                f"/swa/v1/claimants/{claimant.idp_user_xid}/1099G/",
                content_type="application/json",
                HTTP_AUTHORIZATION=format_jwt(header_token),
                data={
                    "file": base64url_encode(file_bytes),
                    "filename": "path/to/f1099g-recipient-example.pdf",
                    "year": "2022",
                },
            )
            self.assertEqual(
                response.json(),
                {"status": "error", "error": "oops!"},
            )
            self.assertEqual(response.status_code, 500)

    def test_v1_act_on_claim_PATCH_fetched(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa(True)
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa, status="in process")
        claim.save()

        claim.events.create(category=Claim.EventCategories.COMPLETED)

        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"fetched": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

        # bad payload
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"fetched": "false"},
        )
        self.assertEqual(
            response.json(), {"status": "error", "error": "unknown action"}
        )
        self.assertEqual(response.status_code, 400)

        # only one action in patch payload
        header_token = generate_auth_token(private_key_jwk, swa.code)
        response = self.client.patch(
            f"/swa/v1/claims/{claim.uuid}/",
            content_type="application/json",
            HTTP_AUTHORIZATION=format_jwt(header_token),
            data={"fetched": "true", "status": "in process"},
        )
        self.assertEqual(
            response.json(),
            {"status": "error", "error": "only one value expected in payload"},
        )
        self.assertEqual(response.status_code, 400)

        # error saving
        with patch("api.models.Claim.objects") as mocked_objects:
            mocked_claim = MagicMock(spec=Claim, name="mocked_claim")
            mocked_claim.swa = swa
            mocked_claim.events.create.side_effect = Exception("db error!")
            mocked_objects.get.return_value = mocked_claim
            header_token = generate_auth_token(private_key_jwk, swa.code)
            with self.assertLogs(level="DEBUG") as cm:
                response = self.client.patch(
                    f"/swa/v1/claims/{claim.uuid}/",
                    content_type="application/json",
                    HTTP_AUTHORIZATION=format_jwt(header_token),
                    data={"fetched": "true"},
                )
                self.assertEqual(
                    response.json(),
                    {"status": "error", "error": "failed to save change"},
                )
                self.assertEqual(response.status_code, 500)
                # the -2 means our logging exception is the 2nd to last in the list
                self.assertIn("ERROR:swa.views:db error!", cm.output[-2])


class Claimant1099GUploaderTestCase(TestCase):
    def setUp(self):
        super().setUp()
        idp = create_idp()
        self.claimant = create_claimant(idp)
        self.swa, _ = create_swa(True)

    def create_uploader(self, body):
        request = RequestFactory().post(
            f"/swa/v1/claimants/{self.claimant.idp_user_xid}/1099G/",
            content_type="application/json",
            data=body,
        )
        request.session = self.client.session
        request.user = self.swa
        uploader = Claimant1099GUploader(request, self.claimant)
        return uploader

    def test_uploader_params(self):
        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertTrue(uploader.validate())
        self.assertFalse(uploader.invalid)

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing year")

        body = {"filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing file")

        body = {"file": "=", "filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "file is not properly Base64-encoded")

        body = {"file": "", "filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "file is empty or improperly encoded")

        body = {"file": base64url_encode("pretend-file"), "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing filename")

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing filename extension")

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.FOO",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(
            uploader.invalid,
            "foo is not an accepted file type. Try one of pdf, png, jpg",
        )

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "22",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "4-digit year required")
