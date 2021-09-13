# -*- coding: utf-8 -*-
from django.test import TestCase, Client


class CoreTestCase(TestCase):
    def test_initclaim_page(self):
        client = Client()
        response = client.get("/initclaim/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)
