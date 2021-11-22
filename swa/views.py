# -*- coding: utf-8 -*-
from django.http import HttpResponse, JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.http import require_http_methods

from home.views import base_url
from jwcrypto.common import json_decode
from core.claim_storage import ClaimReader
from api.models import Claim
import logging
import uuid

logger = logging.getLogger(__name__)


def index(request):
    return HttpResponse("hello world")


@require_http_methods(["GET"])
def GET_v1_claims(request):
    queue = Paginator(request.user.claim_queue().all(), 10)
    page = request.GET.get("page", "1")
    page_of_claims = queue.page(int(page))
    next_page_url = None
    if page_of_claims.has_next():
        next_page_url = (
            f"{base_url(request)}/swa/claims/?page={page_of_claims.next_page_number()}"
        )
    encrypted_claims = []
    for claim in page_of_claims.object_list:
        cr = ClaimReader(claim)
        encrypted_claim = cr.read()
        if not encrypted_claim:
            encrypted_claims.append({"error": f"claim {claim.uuid} missing"})
        else:
            encrypted_claims.append(json_decode(encrypted_claim))

    return JsonResponse(
        {
            "total_claims": queue.count,
            "next": next_page_url,
            "claims": encrypted_claims,
        },
        status=200,
    )


"""
Act on an individual Claim. Based on the HTTP method
and request payload, route further to specific method.
"""


@require_http_methods(["GET", "DELETE", "PATCH"])
def v1_act_on_claim(request, claim_uuid):
    try:
        uuid.UUID(claim_uuid)
    except ValueError as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "invalid claim id format"}, status=400
        )

    try:
        claim = Claim.objects.get(uuid=claim_uuid)
    except Claim.DoesNotExist:
        return JsonResponse(
            {"status": "error", "error": "invalid claim id"}, status=404
        )

    # what's our security posture on this? 404 vs 401
    # at this point we know it's a valid SWA that somehow got the wrong ID value.
    # so "we're among friends" might be appropriate to return 401 to be explicit about why we fail.
    if claim.swa != request.user:
        return JsonResponse(
            {"status": "error", "error": "permission denied"}, status=401
        )

    # route further based on HTTP method and payload
    if request.method == "GET":
        return GET_v1_claim_details(claim)
    elif request.method == "PATCH":
        payload = json_decode(request.body.decode("utf-8"))
        if "status" in payload:
            if len(payload) == 1:
                return PATCH_v1_claim_status(claim, payload["status"])
            return JsonResponse(
                {"status": "error", "error": "only one value expected in payload"},
                status=400,
            )
        if "fetched" in payload and payload["fetched"] == "true":
            if len(payload) == 1:
                return PATCH_v1_claim_fetched(claim, payload["fetched"])
            return JsonResponse(
                {"status": "error", "error": "only one value expected in payload"},
                status=400,
            )

    return JsonResponse({"status": "error", "error": "unknown action"}, status=400)


def GET_v1_claim_details(claim):
    events = claim.public_events()
    response_claim = {
        "id": str(claim.uuid),
        "created_at": str(claim.created_at),
        "updated_at": str(claim.updated_at),
        "claimant_id": claim.claimant_id,
        "events": events,
        "status": claim.status,
    }

    return JsonResponse(response_claim, status=200)


def PATCH_v1_claim_status(claim, new_status):
    try:
        claim.change_status(new_status)
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "failed to save change"}, status=500
        )


def PATCH_v1_claim_fetched(claim, is_fetched):
    try:
        claim.events.create(category=Claim.EventCategories.FETCHED)
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "failed to save change"}, status=500
        )
