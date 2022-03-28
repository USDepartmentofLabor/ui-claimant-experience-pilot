# -*- coding: utf-8 -*-
from django.test import TestCase
from unittest.mock import patch


class ReferenceTestCase(TestCase):
    @patch("reference.middleware.visible.ld_client")
    def test_index_page_hidden(self, patched_ld_client):
        patched_ld_client.variation.return_value = False
        response = self.client.get("/reference/")
        self.assertEqual(response.status_code, 404)

    @patch("reference.middleware.visible.ld_client")
    def test_index_page_shown(self, patched_ld_client):
        patched_ld_client.variation.return_value = True
        response = self.client.get("/reference/")
        self.assertEqual(response.status_code, 200)

    @patch("reference.middleware.visible.ld_client")
    def test_plain_language_page_hidden(self, patched_ld_client):
        patched_ld_client.variation.return_value = False
        response = self.client.get("/reference/plain-language/")
        self.assertEqual(response.status_code, 404)

    @patch("reference.middleware.visible.ld_client")
    def test_plain_language_page_shown(self, patched_ld_client):
        patched_ld_client.variation.return_value = True
        response = self.client.get("/reference/plain-language/")
        self.assertEqual(response.status_code, 200)

    @patch("reference.middleware.visible.ld_client")
    def test_open_source_page_hidden(self, patched_ld_client):
        patched_ld_client.variation.return_value = False
        response = self.client.get("/reference/open-source/")
        self.assertEqual(response.status_code, 404)

    @patch("reference.middleware.visible.ld_client")
    def test_open_source_page_shown(self, patched_ld_client):
        patched_ld_client.variation.return_value = True
        response = self.client.get("/reference/open-source/")
        self.assertEqual(response.status_code, 200)
