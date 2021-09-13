# -*- coding: utf-8 -*-
from django.test import TestCase


class ApiTestCase(TestCase):
    def test_whoami(self):
        session = self.client.session
        session["verified"] = True
        session["whoami"] = {"hello": "world"}
        session.save()

        response = self.client.get("/api/whoami")
        whoami = response.json()
        self.assertEqual(whoami["hello"], "world")
        self.assertIsInstance(whoami["form_id"], str)

    def test_whoami_unverified(self):
        response = self.client.get("/api/whoami")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-verified session"})

    def test_index(self):
        response = self.client.get("/api/")
        about_api = response.json()
        self.assertEqual(about_api["version"], "1.0")
