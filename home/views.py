# -*- coding: utf-8 -*-
from django.shortcuts import render, redirect
from django.conf import settings
from core.utils import session_as_dict
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import logging

logger = logging.getLogger("home")


def index(request):
    return render(None, "index.html", {"base_url": base_url(request)})


def idp(request):
    # TODO pass in a SWA?
    if "redirect_to" in request.GET:
        request.session["redirect_to"] = request.GET["redirect_to"]
    return render(None, "idp.html", {"base_url": base_url(request)})


def test(request):  # pragma: no cover
    request.session.set_test_cookie()
    this_session = session_as_dict(request)
    this_session["test_cookie_worked"] = request.session.test_cookie_worked()
    return JsonResponse(this_session)


# NOTE this login page is for testing only, it is not routed when DEBUG is false
# see views.py
@csrf_exempt
def login(request):
    if request.method == "GET":
        request.session.set_test_cookie()
        return render(None, "login.html", {"base_url": base_url(request)})
    elif request.method == "POST":
        request.session["verified"] = True
        whoami = {}
        for k in request.POST.keys():
            whoami[k] = request.POST[k]
        request.session["whoami"] = whoami
        redirect_to = "/claimant/"
        if "redirect_to" in request.session:
            redirect_to = request.session["redirect_to"]
            del request.session["redirect_to"]
        logger.debug("redirect_to={}".format(redirect_to))
        return redirect(redirect_to)
    else:
        return HttpResponse("GET or POST", 405)


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return settings.BASE_URL
    return f"{request.scheme}://{request.get_host()}"
