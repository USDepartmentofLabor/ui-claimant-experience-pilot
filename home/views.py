# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.conf import settings
from django.http import JsonResponse
import logging

logger = logging.getLogger("home")


def index(request):
    return render(None, "index.html", {"base_url": base_url(request)})


def idp(request):
    # TODO pass in a SWA?
    if "redirect_to" in request.GET:
        request.session["redirect_to"] = request.GET["redirect_to"]
    return render(None, "idp.html", {"base_url": base_url(request)})


def test(request):
    request.session.set_test_cookie()
    this_session = {}
    for k in request.session.keys():
        this_session[k] = request.session[k]
    this_session["test_cookie_worked"] = request.session.test_cookie_worked()
    return JsonResponse(this_session)


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return settings.BASE_URL
    return f"{request.scheme}://{request.get_host()}"
