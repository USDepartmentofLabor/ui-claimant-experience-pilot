# -*- coding: utf-8 -*-
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class SessionTimeout(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        expires_at = request.session.get("expires_at")

        #  End session if expired_at is in the past
        if expires_at and expires_at < timezone.now():
            request.session.flush()
            response = self.get_response(request)
            response.delete_cookie("expires_at")
            logger.debug("⚡️ session expired")
        else:
            expires_at = request.session.get_expiry_date()
            request.session["expires_at"] = expires_at
            response = self.get_response(request)
            response.set_cookie(
                "expires_at", int(expires_at.timestamp() - timezone.now().timestamp())
            )

        return response
