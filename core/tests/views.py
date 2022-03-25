# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from django.core import mail
from core.email import Email
import logging


logger = logging.getLogger(__name__)


class CoreTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    def test_claimant_page(self):
        response = self.client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)

        response = self.client.get("/claimant/?swa=foo")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)
        self.assertEqual(self.client.session.get("swa"), "foo")

    def test_email(self):
        to = "fake@example.com"
        Email(to=to, subject="test", body="hello world").send()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "test")

    def test_404(self):
        resp = self.client.get("/route-that-does-not-exist")
        self.assertContains(resp, "Page not found", status_code=404)

    def test_500(self):
        c = Client(raise_request_exception=False)
        resp = c.get("/500/")
        self.assertContains(resp, "Sorry, we had a problem", status_code=500)

    def test_live(self):
        response = self.client.get("/live/")
        live_resp = response.json()
        self.assertTrue(live_resp["db"])
        self.assertTrue(live_resp["redis"])
        self.assertGreaterEqual(float(live_resp["db_response"]), 0)
        self.assertLess(float(live_resp["db_response"]), 1)
        self.assertGreaterEqual(float(live_resp["redis_response"]), 0)
        self.assertLess(float(live_resp["redis_response"]), 1)
        # celery not running in this test case, but we want to verify the key exists.
        self.assertFalse(live_resp["celery"])
        # status is 503 because celery is offline
        self.assertEqual(response.status_code, 503)
