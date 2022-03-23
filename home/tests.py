# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from django.test.utils import override_settings
from api.models import Claimant, SWA
from api.test_utils import create_swa, create_swa_xid, RESIDENCE_ADDRESS, create_whoami
from unittest.mock import patch
import logging
from core.test_utils import BucketableTestCase
from .views import get_dictionary_value

logger = logging.getLogger("home.tests")

ADDRESS = {}
for k, v in RESIDENCE_ADDRESS.items():
    ADDRESS[f"address.{k}"] = v


class HomeTestCase(TestCase):
    def login(self, swa):
        client = Client()
        session = client.session
        session["authenticated"] = True
        session["whoami"] = create_whoami()
        session["whoami"]["swa"] = swa.for_whoami()
        session.save()
        return client

    def test_custom_filters(self):
        self.assertFalse(get_dictionary_value({"foo": "123"}, "bar"))
        self.assertTrue(get_dictionary_value({"foo": "123"}, "foo"))

    def test_index_page(self):
        response = self.client.get("/")
        self.assertRedirects(
            response,
            "/about/",
            status_code=302,
            fetch_redirect_response=False,
        )

    @override_settings(SHOW_IDP_PAGE_FOR_ALL_SWAS=False)
    def test_idp_page_show_idp_false(self):
        response = self.client.get("/idp/")
        self.assertEqual(response.status_code, 404)

    @override_settings(SHOW_IDP_PAGE_FOR_ALL_SWAS=True)
    def test_idp_page_show_idp_true(self):
        response = self.client.get("/idp/")
        self.assertEqual(response.status_code, 200)

    @override_settings(ENABLE_TEST_LOGIN=True)
    def test_idp_page_show_login_page(self):
        swa, _ = create_swa(is_active=True)
        response = self.client.get("/idp/?swa=XX")
        self.assertEqual(response.status_code, 404)

        # active swa must exist if requested
        response = self.client.get("/idp/?swa=XX&redirect_to=/some/place")
        self.assertEqual(response.status_code, 404)

        response = self.client.get(f"/idp/?swa={swa.code}&redirect_to=/some/place")
        self.assertContains(response, "Log in", status_code=200)
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)

        response = self.client.get(f"/idp/{swa.code}/?redirect_to=/some/place")
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)

        response = self.client.get(f"/idp/{swa.code}/?swa=XX&redirect_to=/some/place")
        self.assertContains(response, "You will now be transferred", status_code=200)
        self.assertContains(response, "redirect_to=/some/place", status_code=200)

    def test_logout_page(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        client = self.login(swa)
        response = client.get("/logout/")
        self.assertRedirects(
            response,
            swa.claimant_url,
            status_code=302,
            fetch_redirect_response=False,
        )

        # with logout_url in session (as for logindotgov)
        client = self.login(swa)
        session = client.session
        session["logout_url"] = "https://elsewhere.example.gov/"
        session.save()
        response = client.get("/logout/")
        self.assertRedirects(
            response,
            "https://elsewhere.example.gov/",
            status_code=302,
            fetch_redirect_response=False,
        )
        self.assertFalse(client.session.get("logout_url"))

    def test_start_page(self):
        self.skipTest("skipped for MVP")  # TODO
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

        # active swa, no such template
        swa, _ = create_swa(
            is_active=True, code="ZZ", claimant_url="https://example.swa.gov/"
        )
        response = self.client.get("/swa-redirect/ZZ/")
        self.assertEqual(response.status_code, 404)

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
            },
        )
        response = self.client.get("/contact/AR/")
        self.assertContains(response, "Contact us", status_code=200)

        # active SWA, but no template
        swa, _ = create_swa(
            is_active=True, code="ZZ", claimant_url="https://example.swa.gov/"
        )
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
        self.assertContains(response, "You must verify your identity", status_code=200)

    def test_level_two(self):
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
