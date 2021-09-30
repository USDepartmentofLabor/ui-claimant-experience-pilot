# -*- coding: utf-8 -*-
from django.test import TestCase
import logging

logger = logging.getLogger("home.tests")


class HomeTestCase(TestCase):
    def test_index_page(self):
        response = self.client.get("/")
        self.assertContains(response, "Apply for benefits", status_code=200)

    def test_idp_page(self):
        response = self.client.get("/idp/?redirect_to=/some/place")
        self.assertContains(response, "Sign in", status_code=200)

    def test_login_page(self):
        response = self.client.get("/login/")
        self.assertContains(response, "Test | Login", status_code=200)
        response = self.client.post(
            "/login/", {"first_name": "Some", "last_name": "Body"}
        )
        self.assertEquals(response.status_code, 302)
        self.assertEquals(
            self.client.session["whoami"], {"first_name": "Some", "last_name": "Body"}
        )
