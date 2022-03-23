# -*- coding: utf-8 -*-
from django.conf import settings
from unittest.mock import MagicMock, patch
from jwcrypto.common import json_encode, base64url_encode, base64url_decode
import logging
from core.test_utils import generate_auth_token
from core.test_utils import BucketableTestCase
from core.claim_storage import ClaimWriter, ClaimReader
from api.test_utils import create_swa, create_idp, create_claimant
from api.models import Claim
from core.claim_encryption import (
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
import uuid

logger = logging.getLogger(__name__)


def format_jwt(token):
    return f"JWT {token}"


class SwaTestCase(BucketableTestCase):
    maxDiff = None

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
            "claimant_id": "my-idp-id",
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
