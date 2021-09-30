# -*- coding: utf-8 -*-
# from django.shortcuts import render, redirect
from django.http import JsonResponse
import logging
import secrets
import os
import django.middleware.csrf
from django.conf import settings
from django.views.decorators.http import require_http_methods
from .decorators import verified_claimant_session
from core.email import Email

logger = logging.getLogger("api")

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
    whoami["csrf_token"] = django.middleware.csrf.get_token(request)
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
    whoami = request.session.get("whoami")
    Email(to=whoami["email"], subject="hello world", body="hello world").send()
    return JsonResponse({"ok": "sent"}, status=201)
