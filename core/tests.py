# -*- coding: utf-8 -*-
from django.test import TestCase, Client


class CoreTestCase(TestCase):
    def test_claimant_page(self):
        client = Client()
        response = client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)
