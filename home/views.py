# -*- coding: utf-8 -*-
from django.shortcuts import render, redirect
from django.views.decorators.cache import never_cache
from django.conf import settings
from django.template.exceptions import TemplateDoesNotExist
from django.utils import timezone
from datetime import timedelta
from core.utils import session_as_dict, register_local_login
from django.http import JsonResponse, HttpResponse
from api.models import SWA
from api.whoami import WhoAmI
from api.claim_finder import ClaimFinder
from api.models.claim import DuplicateSwaXid
import django.middleware.csrf
import logging
from core.local_idp import LocalIdentityProviderError
from core.exceptions import MissingSwaXidError, MalformedSwaXidError
import json
from django.template.defaulttags import register

from launchdarkly.client import ld_client

logger = logging.getLogger("home")


class UnknownError(Exception):
    pass


@register.filter
def get_dictionary_value(dictionary, key):
    return dictionary.get(key)


def handle_404(request, exception=None):
    return render(request, "404.html", status=404)


def handle_500(request):
    return render(request, "500.html", status=500)


def raise_error(request):
    raise UnknownError("something bad")


def active_swas_ordered_by_name():
    return SWA.active.order_by("name").all()


def active_swas_with_featuresets():
    swas = {}
    for swa in SWA.active.all():
        swas[swa.code] = swa.for_whoami()
    return swas


def index(request):
    return redirect("/about/")


# the swa-specific pages should be cache-able
def swa_index(request, swa_code):
    try:
        swa = SWA.active.get(code=swa_code)
        template_file = (
            "swa-index-identity-only.html"
            if swa.is_identity_only()
            else "swa-index.html"
        )
        return render(
            request,
            template_file,
            {
                "swa": swa,
                "swa_contact": f"_swa/{swa_code}/contact_details.html",
                "show_navigation": False,
                "swa_missing_xid": f"_swa/{swa_code}/missing-xid.html",
                "more_help": f"_swa/{swa_code}/more_help.html",
            },
        )
    except SWA.DoesNotExist:
        return handle_404(request, None)


# Contact us per-SWA
# No cache because only available on authenticated session
@never_cache
def swa_contact(request, swa_code):
    if "whoami" not in request.session:
        return handle_404(request, None)

    whoami = WhoAmI.from_dict(request.session.get("whoami"))
    try:
        swa = SWA.active.get(code=swa_code)
        return render(
            request,
            f"_swa/{swa.code}/contact.html",
            {
                "home_path": "/identity/" if swa.is_identity_only() else "/claimant/",
                "contact_us_path": f"/contact/{swa_code}/",
                "whoami": whoami,
                "swa": swa,
                "show_navigation": True,
            },
        )
    except TemplateDoesNotExist as err:
        logger.exception(err)
        return handle_404(request, None)
    except SWA.DoesNotExist:
        logger.debug("No such SWA: {}".format(swa_code))
        return handle_404(request, None)


# our IdP "login" page
# currently only one IdP offered, but could be multiple.
# TODO support redirect_to via path arg rather than param so we can cache only on path
def idp(request, swa_code=None):
    requested_swa = swa_code if swa_code else request.GET.get("swa", None)
    if requested_swa:
        try:
            SWA.active.get(code=requested_swa)
        except SWA.DoesNotExist:
            return handle_404(request, None)

    return render(
        request,
        "idp.html",
        {
            "swa": requested_swa,
            "show_login_page": settings.SHOW_LOGIN_PAGE,
            "swa_featuresets": active_swas_with_featuresets(),
            "swas": active_swas_ordered_by_name(),
            "redirect_to": request.GET.get("redirect_to", ""),
            "show_navigation": False,
        },
    )


# some unhappy-path answer on the /start/* page results in redirect to here
def swa_redirect(request, swa_code):
    try:
        swa = SWA.active.get(code=swa_code)
    except SWA.DoesNotExist:
        swa = None
    try:
        view_args = {
            "swa": swa,
            "swa_redirect": f"_swa/{swa.code}/redirect.html" if swa else None,
        }
        return render(request, "swa-redirect.html", view_args)
    except TemplateDoesNotExist:
        return handle_404(request, None)


@never_cache
def logout(request):
    if "logout_url" in request.session:
        logout_url = request.session["logout_url"]
        del request.session["logout_url"]
        request.session.modified = True
        logger.debug("RP-initiated logout to {}".format(logout_url))
        return redirect(logout_url)

    whoami = WhoAmI.from_dict(request.session.get("whoami"))
    swa_url = whoami.swa.claimant_url
    request.session.flush()
    return redirect(swa_url if whoami.swa.featureset == "Identity Only" else "/")


@never_cache
def ial2required(request):
    return render(
        request,
        "ial2required.html",
        {
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

    # TODO a bug in ld_client lib prevents this from working correctly for core/ld-config.json
    # ldflags = ld_client.all_flags_state({"key": "anonymous-user"}).to_json_dict()
    # logger.debug("LD flags: {}".format(ldflags))

    request.session.set_test_cookie()
    this_session = session_as_dict(request)
    if "partial_claim" in this_session:
        this_session["partial_claim"] = "<redacted>"

    from core.utils import get_session_expires_at

    store_would_have_expired_at = get_session_expires_at(request.session.session_key)
    store_will_expire_at = timezone.now() + timedelta(
        seconds=request.session.get_expiry_age()
    )
    response = {
        "session": this_session,
        "store_would_have_expired_at": store_would_have_expired_at,
        "store_will_expire_at": store_will_expire_at,
    }
    return JsonResponse(response)


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
            request,
            "login.html",
            {
                "whoami": request.session.get("whoami", None),  # if stepping up
                "csrf_token": csrf_token,
                "states": get_states(),
                "ial": request.GET.get("ial", "1"),
                "swa_xid": request.GET.get("swa_xid", None),
                "swa": request.GET.get(
                    "swa", request.GET.get("swa_code", request.session.get("swa", None))
                ),
                "swas": active_swas_ordered_by_name(),
            },
        )
    elif request.method == "POST":
        try:
            whoami = register_local_login(request)
        except LocalIdentityProviderError as error:
            logger.exception(error)
            return render(
                request,
                "auth-error.html",
                {"error": str(error), "swa_login_help": None},
                status=400,
            )
        except DuplicateSwaXid as err:
            logger.exception(err)
            swa = err.swa
            return render(
                request,
                "auth-error.html",
                {
                    "error": str(err),
                    "swa": swa,
                    "swa_login_help": f"_swa/{swa.code}/login_help.html",
                },
                status=500,
            )
        except MissingSwaXidError as err:
            swa_code = err.swa.code
            logger.exception(err)
            return render(
                request,
                "missing-swa-xid.html",
                {
                    "swa": err.swa,
                    "swa_missing_xid": f"_swa/{swa_code}/missing-xid.html",
                    "more_help": f"_swa/{swa_code}/more_help.html",
                },
                status=400,
            )
        except MalformedSwaXidError as err:
            swa_code = err.swa.code
            logger.exception(err)
            return render(
                request,
                "malformed-swa-xid.html",
                {
                    "swa": err.swa,
                    "swa_xid": err,
                    "swa_missing_xid": f"_swa/{swa_code}/missing-xid.html",
                    "more_help": f"_swa/{swa_code}/more_help.html",
                },
                status=400,
            )

        redirect_to = (
            "/identity/" if whoami.swa.featureset == "Identity Only" else "/claimant/"
        )
        if request.session.get("redirect_to", None):
            redirect_to = request.session["redirect_to"]
            del request.session["redirect_to"]
        logger.debug("redirect_to={}".format(redirect_to))
        response = redirect(redirect_to)
        response.delete_cookie("swa_xid")  # just in case
        return response
    else:
        return HttpResponse("GET or POST", status=405)


def get_states():
    state_json_data = open(settings.BASE_DIR / "schemas" / "states.json")
    states = json.load(state_json_data)
    state_json_data.close()
    return states


def start(request):
    states = get_states()
    states_without_swa = ["AS", "FM", "GU", "MH", "MP", "PW"]
    for state in states_without_swa:
        states.pop(state)

    return render(
        request,
        "start.html",
        {
            "swas": states,
            # set basic defaults so var key exists, override in template partials
            "onchange": None,
            "required": False,
        },
    )


@never_cache
def identity(request):
    if "whoami" not in request.session:
        return handle_404(request, None)

    whoami = WhoAmI.from_dict(request.session.get("whoami"))
    IAL = whoami.IAL
    claim = ClaimFinder(whoami).find()
    if not claim:
        logger.error("Missing expected claim for identity-only flow")
        return handle_404(request, None)

    template_name = f"identity/IAL{IAL}.html"
    if claim.is_swa_xid_expired():
        template_name = "identity/expired.html"

    try:
        view_args = {
            "whoami": whoami,
            "swa": claim.swa,
            "ial2error": request.GET.get("ial2error"),
            "contact_us_path": f"/contact/{whoami.swa.code}/",
            "home_path": "/identity/",
            "more_help": f"_swa/{whoami.swa.code}/more_help.html",
            "expired_help": f"_swa/{whoami.swa.code}/expired_help.html",
            "next_steps": f"_swa/{whoami.swa.code}/next_steps.html",
            "other_ways_to_verify_identity": f"_swa/{whoami.swa.code}/other_ways_to_verify_identity.html",
            "idp_url": (
                "/logindotgov/"
                if whoami.identity_provider == "login.gov"
                else "/login/"
            ),
            "completed_at": claim.completed_at(),
            "claim": claim,
            "show_navigation": True,
        }
        return render(request, template_name, view_args)
    except TemplateDoesNotExist as err:
        logger.exception(err)
        return handle_404(request, None)


def about(request):
    return render(request, "about.html")


def maintenance_mode(request):
    return render(
        request,
        "maintenance-mode.html",
        {
            "maintenance_mode_message": ld_client.variation(
                "maintenance-mode-message", {"key": "anonymous-user"}, ""
            )
        },
    )
