# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from django.test.utils import override_settings
from api.models import SWA
from api.test_utils import create_swa, create_swa_xid, create_whoami
from unittest.mock import patch
import logging
from home.views import get_dictionary_value

logger = logging.getLogger(__name__)


class HomeViewsTestCase(TestCase):
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
        self.assertContains(response, "Web address incomplete")

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

    def test_logout_when_not_authenticated(self):
        response = self.client.get("/logout/")
        self.assertRedirects(
            response,
            "/",
            status_code=302,
            fetch_redirect_response=False,
        )

    @override_settings(REQUIRE_PREQUAL_START_PAGE=True)
    def test_start_page_required(self):
        response = self.client.get("/start/")
        self.assertContains(response, "Let's get started", status_code=200)

    @override_settings(REQUIRE_PREQUAL_START_PAGE=False)
    def test_start_page_not_required(self):
        response = self.client.get("/start/")
        self.assertContains(response, "Page not found", status_code=404)

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
