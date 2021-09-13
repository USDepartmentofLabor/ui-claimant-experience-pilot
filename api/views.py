# -*- coding: utf-8 -*-
# from django.shortcuts import render, redirect
from django.http import JsonResponse
import logging
import secrets
import os
from django.conf import settings

logger = logging.getLogger("api")

"""
returns JSON payload about the user with the current session.
includes the form_id that can be used to initialize a claim
form and returned when submitting the form.

401 response means the session has either not yet been created
or still requires IdP AAL2 login.
"""


def whoami(request):
    if not request.session or not request.session.get("verified"):
        return JsonResponse({"error": "un-verified session"}, status=401)
    if not request.session.get("form_id"):
        request.session["form_id"] = secrets.token_hex(16)
    whoami = request.session.get("whoami")
    whoami["form_id"] = request.session["form_id"]
    return JsonResponse(whoami, status=200)


def index(request):
    return JsonResponse(
        {
            "version": "1.0",
            "sha": os.environ.get("UI_API_SHA", "N/A"),
            "url": settings.BASE_URL
            if settings.BASE_URL
            else f"{request.scheme}://{request.get_host()}",
        }
    )
