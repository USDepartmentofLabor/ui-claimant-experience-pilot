# -*- coding: utf-8 -*-
from django.http import HttpResponse, JsonResponse
from django.core.paginator import Paginator
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
import core.context_processors
from jwcrypto.common import json_decode
from core.claim_storage import ClaimReader
from core.swa_xid import SwaXid
from api.models import Claim, Claimant
from api.claim_serializer import ClaimSerializer
from .claimant_1099G_uploader import Claimant1099GUploader
import logging
import uuid

from launchdarkly.client import ld_client

logger = logging.getLogger(__name__)


@never_cache
def index(request):
    return HttpResponse("hello world")


@require_http_methods(["GET"])
@never_cache
def GET_v1_claims(request):
    queue = Paginator(request.user.claim_queue().all(), 10)
    page = request.GET.get("page", "1")
    page_of_claims = queue.page(int(page))
    next_page_url = None
    if page_of_claims.has_next():
        base_url = core.context_processors.base_url(request)["base_url"]
        next_page_url = (
            f"{base_url}/swa/claims/?page={page_of_claims.next_page_number()}"
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
@never_cache
def v1_act_on_claim(request, claim_uuid_or_swa_xid):
    try:
        uuid.UUID(claim_uuid_or_swa_xid)
    except ValueError as err:
        swa_xid = SwaXid(claim_uuid_or_swa_xid, request.user)
        if not swa_xid.format_ok():
            logger.exception(err)
            logger.error("Invalid swa_xid")
            return JsonResponse(
                {"status": "error", "error": "invalid claim id format"}, status=400
            )

    try:
        claim = Claim.find_by_uuid_or_swa_xid(claim_uuid_or_swa_xid)
        if not claim:
            raise Claim.DoesNotExist("no match for {}".format(claim_uuid_or_swa_xid))
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
        if len(payload) != 1:
            return JsonResponse(
                {"status": "error", "error": "only one value expected in payload"},
                status=400,
            )
        if "status" in payload:
            if len(payload) == 1:
                return PATCH_v1_claim_status(claim, payload["status"])
        if "fetched" in payload and str(payload["fetched"].lower()) == "true":
            if len(payload) == 1:
                return PATCH_v1_claim_fetched(claim)
        if "resolved" in payload:
            if len(payload) == 1:
                return PATCH_v1_claim_resolved(claim, payload["resolved"])
    elif request.method == "DELETE":
        return DELETE_v1_claim(claim)

    return JsonResponse({"status": "error", "error": "unknown action"}, status=400)


def GET_v1_claim_details(claim):
    serializer = ClaimSerializer(claim)
    return JsonResponse(serializer.for_swa(), status=200)


def PATCH_v1_claim_status(claim, new_status):
    try:
        claim.change_status(new_status)
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "failed to save change"}, status=500
        )


def PATCH_v1_claim_fetched(claim):
    try:
        claim.events.create(category=Claim.EventCategories.FETCHED)
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "failed to save change"}, status=500
        )


def PATCH_v1_claim_resolved(claim, reason):
    try:
        claim.events.create(
            category=Claim.EventCategories.RESOLVED,
            description=(reason if reason else "[none]"),
        )
        return JsonResponse({"status": "ok"}, status=200)
    except Exception as err:
        logger.exception(err)
        return JsonResponse(
            {"status": "error", "error": "failed to save change"}, status=500
        )


def DELETE_v1_claim(claim):
    from api.models.claim import SUCCESS, NOOP

    error_response = JsonResponse(
        {"status": "error", "error": "failed to delete artifacts"}, status=500
    )
    try:
        resp = claim.delete_artifacts()
        if resp == SUCCESS:
            return JsonResponse({"status": "ok"}, status=200)
        elif resp == NOOP:
            return JsonResponse({"status": "noop"}, status=404)
        else:  # pragma: no cover
            return error_response
    except Exception as err:
        logger.exception(err)
        return error_response


"""
upload a 1099-G file
"""


@require_http_methods(["POST"])
@never_cache
def v1_act_on_claimant_1099G(request, claimant_id):
    ld_flag_set = ld_client.variation(
        "allow-1099g-upload", {"key": "anonymous-user"}, False
    )
    if not ld_flag_set:
        logger.debug("allow-1099g-upload off")
        return JsonResponse({"status": "error", "error": "route not found"}, status=404)

    if request.method == "POST":
        return v1_POST_1099G(request, claimant_id)

    # in theory we never get here but some defensiveness in case someone fails to sync require_http_methods
    return JsonResponse(
        {"status": "error", "error": "unknown action"}, status=400
    )  # pragma: no cover


def v1_POST_1099G(request, claimant_id):
    try:
        claimant = Claimant.objects.get(idp_user_xid=claimant_id)
    except Claimant.DoesNotExist:
        logger.debug("🚀 no claimant for claimant_id {}".format(claimant_id))
        return JsonResponse(
            {"status": "error", "error": "no such Claimant"}, status=404
        )

    uploader = Claimant1099GUploader(request, claimant)
    if uploader.invalid:
        return JsonResponse({"status": "error", "error": uploader.invalid}, status=400)
    if uploader.save():
        return JsonResponse({"status": "ok", "1099G": uploader.form_uuid()}, status=200)
    else:
        return JsonResponse({"status": "error", "error": uploader.error}, status=500)
