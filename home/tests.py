# -*- coding: utf-8 -*-
from django.test import TestCase, Client


class HomeTestCase(TestCase):
    def test_index_page(self):
        client = Client()
        response = client.get("/")
        self.assertContains(response, "Apply for benefits", status_code=200)
