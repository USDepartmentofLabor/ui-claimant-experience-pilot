# -*- coding: utf-8 -*-
from django.core.mail import EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger("email")


class Email(object):
    def __init__(self, to, subject, body):
        self.to = to
        self.subject = subject
        self.body = body

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
