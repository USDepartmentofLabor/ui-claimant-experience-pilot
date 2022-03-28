# -*- coding: utf-8 -*-
from api.models import Claimant, SWA
from api.test_utils import create_swa, RESIDENCE_ADDRESS
import logging
from core.test_utils import BucketableTestCase

logger = logging.getLogger(__name__)

ADDRESS = {}
for k, v in RESIDENCE_ADDRESS.items():
    ADDRESS[f"address.{k}"] = v


class LocalLoginTestCase(BucketableTestCase):
    maxDiff = None

    def test_login_page(self):
        swa, _ = create_swa(is_active=True, code="XX")
        response = self.client.get("/login/?swa=XX&redirect_to=http://example.com/")
        self.assertContains(response, "Login", status_code=200)
        self.assertEquals(self.client.session["redirect_to"], "http://example.com/")
        self.assertEquals(self.client.session["swa"], "XX")
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "swa_code": "XX",
            }
            | ADDRESS,
        )
        self.assertRedirects(
            response,
            "http://example.com/",
            status_code=302,
            fetch_redirect_response=False,
        )
        claimant = Claimant.objects.last()
        verified_at = self.client.session["whoami"]["verified_at"]
        self.assertEquals(
            self.client.session["whoami"],
            {
                "claimant_id": claimant.idp_user_xid,
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "identity_provider": "Local",
                "verified_at": verified_at,
                "birthdate": None,
                "address": {
                    "address1": "123 Any St",
                    "city": "Somewhere",
                    "state": "KS",
                    "zipcode": "00000",
                },
                "ssn": None,
                "swa": {
                    "code": "XX",
                    "name": "XX state name",
                    "claimant_url": "https://some.fake.url",
                    "featureset": "Claim And Identity",
                },
                "csrfmiddlewaretoken": None,
                "claim_id": None,
                "phone": None,
            },
        )
        self.assertEquals(claimant.last_login_event().description, "2")
        self.assertEquals(
            claimant.last_login_event().category, Claimant.EventCategories.LOGGED_IN
        )
        self.assertEquals(claimant.events.last().category, Claimant.EventCategories.IAL)
        self.assertEquals(claimant.events.last().description, "1 => 2")
        self.assertEquals(claimant.IAL, 2)

        # GET or POST only
        response = self.client.head("/login/")
        self.assertEquals(response.status_code, 405)

    def test_local_login_swa_xid(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "ssn": "900001234",
                "swa_code": swa.code,
                "swa_xid": "abc-123",
                "phone": "555-555-5555",
                "birthdate": "1970-01-01",
            }
            | ADDRESS,
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        self.assertTrue(self.client.session["whoami"]["claim_id"])
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertEqual(self.client.session["whoami"]["claim_id"], str(claim.uuid))
        self.assertTrue(claim.is_initiated_with_swa_xid())
        self.assertTrue(claim.completed_artifact_exists())

    def test_local_login_swa_xid_exists_in_session(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        session = self.client.session
        session["swa_xid"] = "abc-123"
        session.save()
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "ssn": "900001234",
                "swa_code": swa.code,
                "phone": "555-555-5555",
                "birthdate": "1970-01-01",
            }
            | ADDRESS,
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        self.assertTrue(self.client.session["whoami"]["claim_id"])

    def test_local_login_missing_swa_xid(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "ssn": "900001234",
                "swa_code": swa.code,
                "phone": "555-555-5555",
                "birthdate": "1970-01-01",
            }
            | ADDRESS,
        )
        self.assertContains(response, "Web address incomplete", status_code=400)

    def test_local_login_malformed_swa_xid(self):
        swa = SWA.active.get(code="AR")
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "ssn": "900001234",
                "swa_code": swa.code,
                "swa_xid": "bad",
                "phone": "555-555-5555",
                "birthdate": "1970-01-01",
            }
            | ADDRESS,
        )
        self.assertContains(response, "Web address invalid", status_code=400)

    def test_local_login_duplicate_swa_xid(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "abc-123",
            },
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        response = self.client.post(
            "/login/",
            {
                "email": "some-one-else@example.com",
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "abc-123",
            },
        )
        self.assertContains(response, "Log in unsuccessful", status_code=500)

    def test_local_login_missing_params(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        response = self.client.post(
            "/login/",
            {
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "abc-123",
            },
        )
        self.assertContains(response, "Log in unsuccessful", status_code=400)
        response = self.client.post(
            "/login/",
            {
                "email": "someone@example.com",
                "IAL": "1",
                "swa_xid": "def-456",
            },
        )
        self.assertContains(response, "Log in unsuccessful", status_code=400)

    def test_local_login_swa_xid_existing_claim(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": swa.code,
                "swa_xid": "abc-123",
            },
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        claim_id = self.client.session["whoami"]["claim_id"]
        self.assertTrue(claim_id)
        self.client.session.flush()  # logout

        # login again w/o swa_xid should find the existing claim
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": swa.code,
            },
        )
        self.assertRedirects(
            response,
            "/identity/",
            status_code=302,
            fetch_redirect_response=False,
        )
        self.assertEquals(claim_id, self.client.session["whoami"]["claim_id"])

    def test_IAL_bump(self):
        swa, _ = create_swa(is_active=True)
        response = self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "1",
                "swa_code": swa.code,
            },
        )
        self.assertEquals(response.status_code, 302)
        claimant = Claimant.objects.last()
        self.assertEquals(claimant.last_login_event().description, "1")
        self.assertEquals(
            claimant.last_login_event().category, Claimant.EventCategories.LOGGED_IN
        )
        self.assertEquals(claimant.events.count(), 1)
        self.assertEquals(claimant.IAL, 1)
