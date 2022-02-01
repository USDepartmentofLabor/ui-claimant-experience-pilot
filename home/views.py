# -*- coding: utf-8 -*-
from django.shortcuts import render, redirect
from django.views.decorators.cache import never_cache
from django.conf import settings

from core.utils import session_as_dict, register_local_login
from django.http import JsonResponse, HttpResponse
from api.models import SWA
import django.middleware.csrf
import logging

import json

from launchdarkly.client import ld_client

logger = logging.getLogger("home")


def handle_404(request, exception=None):
    return render(None, "404.html", {"base_url": base_url(request)}, status=404)


def handle_500(request):
    return render(None, "500.html", {"base_url": base_url(request)}, status=500)


def active_swas_ordered_by_name():
    return SWA.active.order_by("name").all()


# TODO should this be a 404 or a placeholder referring viewers to a SWA finder fed site?
def index(request):
    return render(None, "index.html", {"base_url": base_url(request)})


# the swa-specific pages should be cache-able
def swa_index(request, swa_code):
    try:
        swa = SWA.active.get(code=swa_code)
        return render(
            None, "swa-index.html", {"swa": swa, "base_url": base_url(request)}
        )
    except SWA.DoesNotExist:
        return handle_404(request, None)


# our IdP "login" page
# currently only one IdP offered, but could be multiple.
def idp(request):
    return render(
        None,
        "idp.html",
        {
            "swa": request.GET.get("swa", None),
            "base_url": base_url(request),
            "show_login_page": settings.SHOW_LOGIN_PAGE,
            "swas": active_swas_ordered_by_name(),
            "redirect_to": request.GET.get("redirect_to", ""),
        },
    )


# some unhappy-path answer on the /prequal page results in redirect to here
def swa_redirect(request, swa_code):
    try:
        swa = SWA.active.get(code=swa_code)
    except SWA.DoesNotExist:
        swa = None
    view_args = {"swa": swa, "base_url": base_url(request)}
    return render(None, "swa-redirect.html", view_args)


@never_cache
def logout(request):
    request.session.flush()
    return redirect("/")


@never_cache
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


@never_cache
def test(request):  # pragma: no cover
    ld_flag_set = ld_client.variation(
        "test-flag-server", {"key": "anonymous-user"}, False
    )
    if not ld_flag_set:
        return handle_404(request)

    request.session.set_test_cookie()
    this_session = session_as_dict(request)
    this_session["test_cookie_worked"] = request.session.test_cookie_worked()
    this_session["test_flag_worked"] = ld_flag_set
    return JsonResponse(this_session)


# NOTE this login page is for testing only, see the SHOW_LOGIN_PAGE setting in views.py
@never_cache
def login(request):
    if request.method == "GET":
        # make sure we init both session and CSRF cookies
        request.session.set_test_cookie()
        csrf_token = django.middleware.csrf.get_token(request)
        # stash params for post-login
        if request.GET.get("redirect_to", None):
            request.session["redirect_to"] = request.GET["redirect_to"]
        if request.GET.get("swa", None):
            request.session["swa"] = request.GET["swa"]
        return render(
            None,
            "login.html",
            {
                "base_url": base_url(request),
                "csrf_token": csrf_token,
                "swa": request.GET.get("swa", request.session.get("swa", None)),
                "swas": active_swas_ordered_by_name(),
            },
        )
    elif request.method == "POST":
        register_local_login(request)
        redirect_to = "/claimant/"
        if request.session.get("redirect_to", None):
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
            # set basic defaults so var key exists, override in template partials
            "onchange": None,
            "required": False,
        },
    )


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return settings.BASE_URL
    return f"{request.scheme}://{request.get_host()}"
