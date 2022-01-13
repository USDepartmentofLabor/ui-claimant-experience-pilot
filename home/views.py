# -*- coding: utf-8 -*-
from django.shortcuts import render, redirect
from django.conf import settings
from core.utils import session_as_dict, register_local_login
from django.http import JsonResponse, HttpResponse
from api.models import SWA
import django.middleware.csrf
import logging

import json

logger = logging.getLogger("home")


def handle_404(request, exception):
    return render(None, "404.html", {"base_url": base_url(request)}, status=404)


def handle_500(request):
    return render(None, "500.html", {"base_url": base_url(request)}, status=500)


def active_swas_ordered_by_name():
    return SWA.active.order_by("name").all()


def index(request):
    return render(None, "index.html", {"base_url": base_url(request)})


def idp(request):
    if "redirect_to" in request.GET:
        request.session["redirect_to"] = request.GET["redirect_to"]
    return render(
        None,
        "idp.html",
        {
            "base_url": base_url(request),
            "show_login_page": settings.SHOW_LOGIN_PAGE,
            "swas": active_swas_ordered_by_name(),
        },
    )


def logout(request):
    request.session.flush()
    return redirect("/")


def ial2required(request):
    return render(
        None,
        "ial2required.html",
        {
            "base_url": base_url(request),
            "swas": active_swas_ordered_by_name(),
            "idp_path": request.GET.get("idp", "logindotgov"),
        },
    )


def test(request):  # pragma: no cover
    request.session.set_test_cookie()
    this_session = session_as_dict(request)
    this_session["test_cookie_worked"] = request.session.test_cookie_worked()
    return JsonResponse(this_session)


# NOTE this login page is for testing only, see the SHOW_LOGIN_PAGE setting in views.py
def login(request):
    if request.method == "GET":
        # make sure we init both session and CSRF cookies
        request.session.set_test_cookie()
        csrf_token = django.middleware.csrf.get_token(request)
        # stash params for post-login
        if "redirect_to" in request.GET:
            request.session["redirect_to"] = request.GET["redirect_to"]
        if "swa" in request.GET:
            request.session["swa"] = request.GET["swa"]
        return render(
            None,
            "login.html",
            {
                "base_url": base_url(request),
                "csrf_token": csrf_token,
                "swas": active_swas_ordered_by_name(),
            },
        )
    elif request.method == "POST":
        register_local_login(request)
        redirect_to = "/claimant/"
        if "redirect_to" in request.session:
            redirect_to = request.session["redirect_to"]
            del request.session["redirect_to"]
        logger.debug("redirect_to={}".format(redirect_to))
        return redirect(redirect_to)
    else:
        return HttpResponse("GET or POST", status=405)


def prequalifications(request):
    state_json_data = open(settings.BASE_DIR / "schemas" / "states.json")
    states = json.load(state_json_data)
    state_json_data.close()
    states_without_swa = ["AS", "FM", "GU", "MH", "MP", "PW"]
    for state in states_without_swa:
        states.pop(state)

    return render(
        None,
        "prequalifications.html",
        {
            "base_url": base_url(request),
            "swas": states,
            "styles": {
                "section_margin": "margin-top-6",
                "section_heading": "font-heading-sm",
            },
        },
    )


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return settings.BASE_URL
    return f"{request.scheme}://{request.get_host()}"
