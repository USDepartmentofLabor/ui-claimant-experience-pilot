# -*- coding: utf-8 -*-
import logging
from django.http import Http404
from launchdarkly.client import ld_client


logger = logging.getLogger(__name__)


class ReferenceVisibility(object):
    def __init__(self, get_response):
        """
        One-time configuration and initialisation.
        """
        self.get_response = get_response

    def __call__(self, request):
        """
        Code to be executed for each request before the view (and later
        middleware) are called.
        """
        if request.path.startswith("/reference/") and not ld_client.variation(
            "show-reference", {"key": "anonymous-user"}, False
        ):
            raise Http404("Page does not exist")
        response = self.get_response(request)
        return response
