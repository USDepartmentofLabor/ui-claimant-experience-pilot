# -*- coding: utf-8 -*-
from api.models import SWA
from api.test_utils import create_swa, create_swa_xid, RESIDENCE_ADDRESS, create_whoami
from api.claim_finder import ClaimFinder
from api.whoami import WhoAmI
import logging
from core.test_utils import BucketableTestCase

logger = logging.getLogger(__name__)

ADDRESS = {}
for k, v in RESIDENCE_ADDRESS.items():
    ADDRESS[f"address.{k}"] = v


class IdentityTestCase(BucketableTestCase):
    def test_level_one(self):
        whoami = create_whoami()
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        whoami["swa"] = swa.for_whoami()

        response = self.client.post(
            "/login/",
            {
                "email": whoami["email"],
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": create_swa_xid(swa),
            },
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        response = self.client.get("/identity/")

        self.assertContains(
            response, "You will need to verify your identity", status_code=200
        )
        claim = ClaimFinder(WhoAmI.from_dict(self.client.session["whoami"])).find()
        partial_claim = claim.read_partial()
        self.assertEqual(partial_claim["email"], whoami["email"])
        self.assertEqual(partial_claim["identity_assurance_level"], 1)

    def test_level_two(self):
        whoami = create_whoami()
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        whoami["swa"] = swa.for_whoami()
        swa_xid = create_swa_xid(swa)

        response = self.client.post(
            "/login/",
            {
                "email": whoami["email"],
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": swa_xid,
            },
        )
        # coerce payload into expected format
        whoami_ial2 = whoami | ADDRESS
        whoami_ial2["swa_code"] = swa.code
        del whoami_ial2["address"]

        response = self.client.post("/login/", whoami_ial2)
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        response = self.client.get("/identity/")
        self.assertContains(
            response, "Identity verification submitted", status_code=200
        )
        claim = ClaimFinder(WhoAmI.from_dict(self.client.session["whoami"])).find()
        # we cannot read the completed claim, can only verify it exists
        partial_claim = claim.read_partial()
        self.assertEqual(partial_claim["email"], whoami["email"])
        self.assertEqual(partial_claim["identity_assurance_level"], 1)
        self.assertTrue(claim.completed_artifact_exists())

        # logout, login again should immediately show success page
        self.client.get("/logout/")
        self.client.post(
            "/login/",
            {
                "email": whoami["email"],
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": swa_xid,
            },
        )
        response = self.client.get("/identity/")
        self.assertContains(
            response, "Identity verification submitted", status_code=200
        )

    def test_swa_xid_expired(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "20000101-123456-abc",
            },
        )
        response = self.client.get("/identity/")
        self.assertContains(
            response,
            "didn't complete your online identity verification in time",
            status_code=200,
        )

    def test_swa_with_claim_featureset(self):
        whoami = create_whoami()
        swa, _ = create_swa(is_active=True)
        whoami["swa"] = swa.for_whoami()

        # no swa_xid
        response = self.client.post(
            "/login/",
            {
                "email": whoami["email"],
                "IAL": "1",
                "swa_code": swa.code,
            },
        )
        self.assertRedirects(
            response,
            "/claimant/",
            status_code=302,
            fetch_redirect_response=False,
        )
        response = self.client.get("/identity/")
        self.assertEqual(response.status_code, 404)

        # with swa_xid
        response = self.client.post(
            "/login/",
            {
                "email": whoami["email"],
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": create_swa_xid(swa),
            },
        )
        self.assertRedirects(
            response,
            "/claimant/",
            status_code=302,
            fetch_redirect_response=False,
        )
        response = self.client.get("/identity/")
        self.assertEqual(response.status_code, 200)

    def test_not_authenticated(self):
        response = self.client.get("/identity/")
        self.assertEqual(response.status_code, 404)

    def test_swa_with_no_template_support(self):
        swa, _ = create_swa(is_active=True, code="NO")
        self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "20000101-123456-abc",
            },
        )
        response = self.client.get("/identity/")
        self.assertEqual(response.status_code, 404)
