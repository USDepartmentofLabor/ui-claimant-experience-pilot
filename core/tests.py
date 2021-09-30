# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from core.email import Email
from django.core import mail


class CoreTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    def test_claimant_page(self):
        client = Client()
        response = client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)

    def test_email(self):
        to = "fake@example.com"
        Email(to=to, subject="test", body="hello world").send()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "test")
