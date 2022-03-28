# -*- coding: utf-8 -*-
from django.core import mail
from django.template.loader import render_to_string
from core.tasks_tests import CeleryTestCase
from api.models import Claim, SWA
import logging
from core.email import InitialClaimConfirmationEmail


logger = logging.getLogger(__name__)


class EmailTestCase(CeleryTestCase):
    def setUp(self):
        super().setUp()
        # Empty the test outbox
        mail.outbox = []

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()

    def test_initial_claim_confirmation_email(self):
        claim = Claim(
            uuid="1234", swa=SWA(name="Some State", claimant_url="www.mystateswa.com")
        )
        email_address = "fake@example.com"
        email = InitialClaimConfirmationEmail(claim, email_address)
        email.send_later()
        # this requires celery task to run to completion async,
        # so wait a little
        self.wait_for_workers_to_finish()
        email_body = render_to_string(
            "emails/claim_confirmation_email.txt",
            {"swa": claim.swa, "claim_id": claim.uuid},
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Your UI Claim receipt")
        self.assertTemplateUsed(template_name="emails/claim_confirmation_email.txt")
        self.assertEqual(email_body, mail.outbox[0].body)
        # ensure the variables are rendering
        self.assertIn(
            "Your claim has been forwarded to Some State", mail.outbox[0].body
        )
