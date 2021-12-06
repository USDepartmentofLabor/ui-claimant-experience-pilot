# -*- coding: utf-8 -*-
# from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse
import logging
import secrets
import os
from django.conf import settings
from django.db import transaction
import django.middleware.csrf
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from .decorators import verified_claimant_session
from .claim_request import ClaimRequest
from .claim_validator import ClaimValidator, CompletedClaimValidator
from .models import Claim
from core.email import InitialClaimConfirmationEmail
from core.utils import register_local_login
from core.claim_storage import ClaimWriter
from core.claim_encryption import (
    AsymmetricClaimEncryptor,
    SymmetricClaimEncryptor,
    symmetric_encryption_key,
)

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


@require_http_methods(["POST"])
@verified_claimant_session
def logout(request):
    request.session.flush()
    return HttpResponse(status=204)


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
        claim_request.payload["validated_at"] = timezone.now().isoformat()
        claim_request.payload["$schema"] = claim_validator.schema_url

    # log we received the claim
    claim_request.claim.events.create(category=Claim.EventCategories.SUBMITTED)

    # now that we have a Claim, stash its info in session
    request.session["whoami"]["claim_id"] = claim_request.payload["id"]
    request.session["claim"] = claim_request.payload

    if claim_request.is_complete:
        return save_completed_claim(claim_request)
    else:
        return save_partial_claim(claim_request)


def save_completed_claim(claim_request):
    # re-validate with complete schema
    completed_claim_validator = CompletedClaimValidator(claim_request.payload)
    if not completed_claim_validator.valid:
        return JsonResponse(
            {
                "status": "error",
                "error": "invalid complete claim",
                "errors": completed_claim_validator.errors_as_dict(),
            },
            status=400,
        )
    # ok to package for SWA
    asym_encryptor = AsymmetricClaimEncryptor(
        claim_request.payload, claim_request.swa.public_key_as_jwk()
    )
    packaged_claim = asym_encryptor.packaged_claim()
    packaged_payload = packaged_claim.as_json()
    claim = claim_request.claim
    try:
        with transaction.atomic():
            claim.events.create(category=Claim.EventCategories.COMPLETED)
            cw = ClaimWriter(
                claim, packaged_payload, path=claim.completed_payload_path()
            )
            if not cw.write():
                raise Exception("Failed to write completed claim")
        logger.debug("🚀 wrote completed claim")
        InitialClaimConfirmationEmail(
            email_address=claim_request.whoami["email"],
            claim=claim,
        ).send_later()
        return JsonResponse(
            {"status": "accepted", "claim_id": claim_request.payload["id"]}, status=201
        )
    except Exception as error:
        logger.exception(error)
        return JsonResponse(
            {"status": "error", "error": "unable to save claim"}, status=500
        )


def save_partial_claim(claim_request):
    # save the partial (incomplete) claim
    sym_encryptor = SymmetricClaimEncryptor(
        claim_request.payload, symmetric_encryption_key()
    )
    packaged_claim = sym_encryptor.packaged_claim()
    packaged_payload = packaged_claim.as_json()
    claim = claim_request.claim
    try:
        # TODO depending on performance, we might want to move this to an async task
        cw = ClaimWriter(claim, packaged_payload, path=claim.partial_payload_path())
        if not cw.write():
            raise Exception("Failed to write partial claim")
        logger.debug("🚀 wrote partial claim")
        return JsonResponse(
            {"status": "accepted", "claim_id": claim_request.payload["id"]}, status=202
        )
    except Exception as error:
        logger.exception(error)
        return JsonResponse(
            {"status": "error", "error": "unable to save claim"}, status=500
        )
