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
from .claim_request import ClaimRequest
from .claim_validator import ClaimValidator
from core.email import Email
from core.utils import register_local_login
from core.claim_storage import ClaimWriter
from datetime import datetime
from core.claim_encryption import AsymmetricClaimEncryptor


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
    if "swa" in request.session and "swa_code" not in whoami:
        whoami["swa_code"] = request.session["swa"]
    # set csrftoken cookie
    django.middleware.csrf.get_token(request)
    return JsonResponse(whoami, status=200)


"""
Root endpoint for the /api/ space. Returns metadata about the API itself.
"""


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
    claim_request = ClaimRequest(request)
    if claim_request.error:
        logger.error(claim_request.error)
        return claim_request.response

    claim_validator = ClaimValidator(claim_request.payload)
    if not claim_validator.valid:
        return JsonResponse(
            {
                "status": "error",
                "error": "invalid claim",
                "errors": claim_validator.errors_as_dict(),
            },
            status=400,
        )
    else:
        # mark our payload with validation info
        claim_request.payload["validated_at"] = datetime.now().isoformat()
        claim_request.payload["$schema"] = claim_validator.schema_url

    # encrypt payload
    asym_encryptor = AsymmetricClaimEncryptor(
        claim_request.payload, claim_request.swa.public_key_as_jwk()
    )
    packaged_claim = asym_encryptor.packaged_claim()
    writeable_payload = packaged_claim.as_json()

    # now that we have a Claim, stash its info in session
    claim_id = claim_request.payload["id"]
    request.session["whoami"]["claim_id"] = claim_id

    cw = ClaimWriter(claim_request.claim, writeable_payload)
    if cw.write():
        # only send email if the Claim was "complete"
        if claim_request.claim.is_complete():
            Email(
                to=claim_request.whoami["email"],
                subject="hello world",
                body="hello world",
            ).send_later()
        return JsonResponse({"status": "accepted", "claim_id": claim_id}, status=202)
    else:
        return JsonResponse(
            {"status": "error", "error": "unable to save claim"}, status=500
        )
