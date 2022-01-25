# -*- coding: utf-8 -*-
from django.test import TestCase
from api.models import Claimant
from api.test_utils import create_swa
import logging

logger = logging.getLogger("home.tests")


class HomeTestCase(TestCase):
    def test_index_page(self):
        response = self.client.get("/")
        self.assertContains(response, "Apply for benefits", status_code=200)

    def test_idp_page(self):
        response = self.client.get("/idp/?redirect_to=/some/place")
        self.assertContains(response, "Sign in", status_code=200)

    def test_ial2required_page(self):
        response = self.client.get("/ial2required/?idp=foo")
        self.assertContains(response, "foo/?ial=1", status_code=200)

    def test_login_page(self):
        response = self.client.get("/login/?swa=XX&redirect_to=http://example.com/")
        self.assertContains(response, "Login", status_code=200)
        self.assertEquals(self.client.session["redirect_to"], "http://example.com/")
        self.assertEquals(self.client.session["swa"], "XX")
        response = self.client.post(
            "/login/",
            {"email": "some@example.com", "first_name": "Some", "last_name": "Body"},
        )
        self.assertRedirects(
            response,
            "http://example.com/",
            status_code=302,
            fetch_redirect_response=False,
        )
        claimant = Claimant.objects.last()
        self.assertEquals(
            self.client.session["whoami"],
            {
                "claimant_id": claimant.idp_user_xid,
                "email": "some@example.com",
                "first_name": "Some",
                "last_name": "Body",
            },
        )

        # GET or POST only
        response = self.client.head("/login/")
        self.assertEquals(response.status_code, 405)

    def test_logout_page(self):
        self.client.post(
            "/login/",
            {"email": "some@example.com", "first_name": "Some", "last_name": "Body"},
        )
        response = self.client.get("/logout/")
        self.assertRedirects(
            response,
            "/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_prequalifications_page(self):
        response = self.client.get("/prequal/")
        self.assertContains(response, "Prequalifications", status_code=200)

    def test_swa_redirect_page(self):
        # with active SWA we get a link to the SWA
        swa, _ = create_swa(is_active=True, claimant_url="https://example.swa.gov/")
        response = self.client.get(f"/swa-redirect/{swa.code}/")
        self.assertContains(response, "link to the SWA page", status_code=200)

        # not found or inactive SWA, we get link to federal site
        response = self.client.get("/swa-redirect/XX/")
        self.assertContains(response, "link to a federal", status_code=200)

    def test_swa_start_page(self):
        # with active SWA we get a link to the SWA
        swa, _ = create_swa(is_active=True, claimant_url="https://example.swa.gov/")
        response = self.client.get(f"/start/{swa.code}/")
        self.assertContains(response, swa.name, status_code=200)

        # not found or inactive SWA, we get 404
        response = self.client.get("/start/XX/")
        self.assertContains(response, "Sorry", status_code=404)
