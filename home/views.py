# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.conf import settings
import logging

logger = logging.getLogger("home")


def index(request):
    return render(None, "index.html", {"base_url": base_url(request)})


def idp(request):
    # TODO pass in a SWA?
    if "redirect_to" in request.GET:
        request.session["redirect_to"] = request.GET["redirect_to"]
    return render(None, "idp.html", {"base_url": base_url(request)})


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return settings.BASE_URL
    return f"{request.scheme}://{request.get_host()}"
