# -*- coding: utf-8 -*-
from django.test import TestCase


class HomeTestCase(TestCase):
    def test_index_page(self):
        response = self.client.get("/")
        self.assertContains(response, "Apply for benefits", status_code=200)

    def test_idp_page(self):
        response = self.client.get("/idp?redirect_to=/some/place")
        self.assertContains(response, "Sign in", status_code=200)
