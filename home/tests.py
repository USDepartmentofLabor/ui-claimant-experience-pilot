# -*- coding: utf-8 -*-
from django.test import TestCase
from api.models import Claimant, SWA
from api.test_utils import create_swa, create_swa_xid
from unittest.mock import patch
import logging
from core.tests import BucketableTestCase

logger = logging.getLogger("home.tests")


class HomeTestCase(TestCase):
    def test_index_page(self):
        response = self.client.get("/")
        self.assertRedirects(
            response,
            "/about/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_idp_page(self):
        response = self.client.get("/idp/?redirect_to=/some/place")
        self.assertContains(response, "Sign in", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)

        # active swa must exist if requested
        swa, _ = create_swa(is_active=True)
        response = self.client.get("/idp/?swa=XX&redirect_to=/some/place")
        self.assertEqual(response.status_code, 404)
        response = self.client.get(f"/idp/?swa={swa.code}&redirect_to=/some/place")
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)
        response = self.client.get(f"/idp/{swa.code}/?redirect_to=/some/place")
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)
        response = self.client.get(f"/idp/{swa.code}/?swa=XX&redirect_to=/some/place")
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)

    def test_logout_page(self):
        swa, _ = create_swa(is_active=True)
        self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
                "IAL": "2",
                "swa_code": swa.code,
            },
        )
        response = self.client.get("/logout/")
        self.assertRedirects(
            response,
            "/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_start_page(self):
        response = self.client.get("/start/")
        self.assertContains(response, "Let's get started", status_code=200)

    def test_swa_redirect_page(self):
        # with active SWA we get a link to the SWA
        swa, _ = create_swa(is_active=True, claimant_url="https://example.swa.gov/")
        response = self.client.get(f"/swa-redirect/{swa.code}/")
        self.assertContains(response, swa.name, status_code=200)

        # not found or inactive SWA, we get link to federal site
        response = self.client.get("/swa-redirect/XX/")
        self.assertContains(response, "your state's", status_code=200)

    @patch("home.views.ld_client")
    def test_launchdarkly_flag_received(self, patched_ld_client):
        patched_ld_client.variation.return_value = True
        response = self.client.get("/test/")
        self.assertEqual(response.status_code, 200)

        patched_ld_client.variation.return_value = False
        response = self.client.get("/test/")
        self.assertEqual(response.status_code, 404)

    def test_swa_start_page(self):
        # with active SWA we get a link to the SWA
        swa, _ = create_swa(is_active=True, claimant_url="https://example.swa.gov/")
        response = self.client.get(f"/start/{swa.code}/")
        self.assertContains(response, swa.name, status_code=200)

        # not found or inactive SWA, we get 404
        response = self.client.get("/start/XX/")
        self.assertContains(response, "Page not found", status_code=404)

    def test_swa_contact_page(self):
        # active but no whoami
        nj_swa = SWA.active.get(code="NJ")
        response = self.client.get(f"/contact/{nj_swa.code}/")
        self.assertEquals(response.status_code, 404)

        # active SWA, but no template
        swa, _ = create_swa(is_active=True, claimant_url="https://example.swa.gov/")
        response = self.client.get(f"/contact/{swa.code}/")
        self.assertEqual(response.status_code, 404)

        # inactive SWA
        swa, _ = create_swa(
            is_active=False, code="NO", claimant_url="https://example.swa.gov/"
        )
        response = self.client.get(f"/contact/{swa.code}/")
        self.assertEqual(response.status_code, 404)

        # no such SWA
        response = self.client.get("/contact/foobar/")
        self.assertEqual(response.status_code, 404)

        # whoami logged in
        swa = SWA.active.get(code="AR")
        swa_xid = create_swa_xid(swa)
        self.client.post(
            "/login/",
            {
                "email": "some@example.com",
                "IAL": "1",
                "swa_code": "AR",
                "swa_xid": swa_xid,
            }
            | ADDRESS,
        )
        response = self.client.get("/contact/AR/")
        self.assertContains(response, "Contact us", status_code=200)


ADDRESS = {
    "address.address1": "123 Any St",
    "address.city": "Some",
    "address.state": "KS",
    "address.zipcode": "00000",
}


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
                    "city": "Some",
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
