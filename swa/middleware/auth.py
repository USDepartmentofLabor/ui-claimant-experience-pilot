# -*- coding: utf-8 -*-
import logging
from django.http import JsonResponse
from .jwt_authorizer import JwtAuthorizer


logger = logging.getLogger(__name__)


class SWAAuth(object):
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
        if request.path.startswith("/swa/"):
            self.authorize_request(request)
            if not request.verified_swa_request:
                return JsonResponse({"error": "invalid request"}, status=401)
        response = self.get_response(request)
        return response

    def authorize_request(self, request):
        authorizer = JwtAuthorizer(request)
        if not authorizer.authorized:
            request.verified_swa_request = False
            return request

        request.verified_swa_request = True
        request._dont_enforce_csrf_checks = True
        request.user = authorizer.swa
        return request

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Called just before Django calls the view.
        """
        return None

    def process_exception(self, request, exception):
        """
        Called when a view raises an exception.
        """
        return None

    def process_template_response(self, request, response):  # pragma: no cover
        """
        Called just after the view has finished executing.
        """
        return response
