# -*- coding: utf-8 -*-
# utility decorators to DRY up common API view behavior

from functools import wraps
from django.http import JsonResponse


def authenticated_claimant_session(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.session or not request.session.get("authenticated"):
            return JsonResponse({"error": "un-authenticated session"}, status=401)
        return view_func(request)

    return _wrapped_view
