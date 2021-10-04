# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from django.core import mail


class ApiTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    def verify_session(self, client=None):
        client = client if client else self.client
        session = client.session
        session["verified"] = True
        session["whoami"] = {"hello": "world", "email": "someone@example.com"}
        session.save()

    def csrf_client(self):
        # by default self.client relaxes the CSRF check, so we create our own client to test.
        c = Client(enforce_csrf_checks=True)
        self.verify_session(c)
        return c

    def test_whoami(self):
        self.verify_session()
        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["hello"], "world")
        self.assertIsInstance(whoami["form_id"], str)
        # only GET allowed
        response = self.client.post("/api/whoami/")
        self.assertEqual(response.status_code, 405)

    def test_whoami_unverified(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-verified session"})

    def test_index(self):
        response = self.client.get("/api/")
        about_api = response.json()
        self.assertEqual(about_api["version"], "1.0")
        # only GET allowed
        response = self.client.post("/api/")
        self.assertEqual(response.status_code, 405)

    def test_claim_unverified(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-verified session"})

    def test_claim_without_csrf(self):
        csrf_client = self.csrf_client()
        response = csrf_client.post(
            "/api/claim/", content_type="application/json", data={}
        )
        self.assertEqual(response.status_code, 403)

    def test_claim_with_csrf(self):
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/claim/"
        payload = {}
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json(), {"ok": "sent"})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "hello world")

        # only POST allowed
        response = csrf_client.get(url)
        self.assertEqual(response.status_code, 405)

    def test_login(self):
        self.assertFalse("verified" in self.client.session)
        response = self.client.post("/api/login/", {"email": "someone@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["verified"])

    def test_login_json(self):
        self.assertFalse("verified" in self.client.session)
        response = self.client.post(
            "/api/login/",
            data={"email": "someone@example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["verified"])
