# -*- coding: utf-8 -*-
# from django.shortcuts import render, redirect
from django.http import JsonResponse
import logging
import secrets
import os
from django.conf import settings
import django.middleware.csrf
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .decorators import verified_claimant_session
from core.email import Email
from core.utils import register_local_login

# import json

logger = logging.getLogger("api")

"""
No CSRF required for this dev/test-only endpoint.
Sidesteps the IdP process completely, similar to the /login endpoint.
Useful mostly for running Cypress tests locally using the dev server.
Only mounted when SHOW_LOGIN_PAGE is true. See urls.py.
"""


@require_http_methods(["POST"])
@csrf_exempt
def login(request):
    whoami = register_local_login(request)
    return JsonResponse(whoami, status=200)


"""
returns JSON payload about the user with the current session.
includes the form_id that can be used to initialize a claim
form and returned when submitting the form.

401 response means the session has either not yet been created
or still requires IdP AAL2 login.
"""


@require_http_methods(["GET"])
@verified_claimant_session
def whoami(request):
    if not request.session.get("form_id"):
        request.session["form_id"] = secrets.token_hex(16)
    whoami = request.session.get("whoami")
    whoami["form_id"] = request.session["form_id"]
    # set csrftoken cookie
    django.middleware.csrf.get_token(request)
    return JsonResponse(whoami, status=200)


@require_http_methods(["GET"])
def index(request):
    return JsonResponse(
        {
            "version": "1.0",
            "sha": os.environ.get("UI_API_SHA", "N/A"),
            "build": os.environ.get("BUILD_TIME", "N/A"),
            "url": settings.BASE_URL
            if settings.BASE_URL
            else f"{request.scheme}://{request.get_host()}",
        }
    )


@require_http_methods(["POST"])
@verified_claimant_session
def claim(request):
    # payload = json.loads(request.body.decode("utf-8"))
    # TODO ignoring payload for now, will use once we have a form.
    whoami = request.session.get("whoami")
    Email(to=whoami["email"], subject="hello world", body="hello world").send_later()
    return JsonResponse({"ok": "sent"}, status=201)
