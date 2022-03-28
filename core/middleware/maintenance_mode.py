# -*- coding: utf-8 -*-
import logging

from launchdarkly.client import ld_client
from home.views import maintenance_mode

logger = logging.getLogger(__name__)


class MaintenanceMode(object):
    def __init__(self, get_response):
        """
        One-time configuration and initialisation.
        """
        self.get_response = get_response

    def __call__(self, request):
        if not (request.path.startswith("/swa/") or request.path.startswith("/api/")):
            if ld_client.variation(
                "maintenance-mode", {"key": "anonymous-user"}, False
            ):
                return maintenance_mode(request)
        response = self.get_response(request)
        return response
