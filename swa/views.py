# -*- coding: utf-8 -*-
from django.http import HttpResponse, JsonResponse
from django.core.paginator import Paginator
from home.views import base_url
from jwcrypto.common import json_decode
from core.claim_storage import ClaimReader
from django.views.decorators.http import require_http_methods


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
