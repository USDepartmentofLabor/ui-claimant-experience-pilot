# -*- coding: utf-8 -*-
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from celery import shared_task
import logging

logger = logging.getLogger("email")


@shared_task
def send_task(email_dict):
    email = Email(**email_dict)
    email.send()


class Email(object):
    def __init__(self, to, subject, body):
        self.to = to
        self.subject = subject
        self.body = body

    def to_dict(self):
        return {"to": self.to, "subject": self.subject, "body": self.body}

    def send(self):
        email = EmailMessage(
            self.subject,
            self.body,
            settings.EMAIL_FROM,
            [self.to],
            # ["bcc@example.com"],
            reply_to=[settings.EMAIL_REPLY_TO],
            headers={"X-DOL": "Claimant"},
        )
        return email.send()

    def send_later(self):
        return send_task.delay(self.to_dict())


class InitialClaimConfirmationEmail(object):
    def __init__(self, claim, email_address):
        self.claim = claim
        self.email_address = email_address

    def send_later(self):
        email_body = render_to_string(
            "emails/claim_confirmation_email.txt",
            {"swa": self.claim.swa, "claim_id": self.claim.uuid},
        )
        email = Email(
            to=self.email_address, subject="Your UI Claim receipt", body=email_body
        )
        return email.send_later()
