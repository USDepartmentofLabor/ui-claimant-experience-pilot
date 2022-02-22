# -*- coding: utf-8 -*-
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.db import transaction
import logging
import secrets
import os
from logindotgov.oidc import LoginDotGovOIDCClient, LoginDotGovOIDCError, IAL2, IAL1
from core.utils import session_as_dict, hash_idp_user_xid
from api.models import Claimant, IdentityProvider, SWA, Claim
from django.conf import settings
from api.whoami import WhoAmI, WhoAmIAddress
from home.views import base_url, handle_404

logger = logging.getLogger("logindotgov")

if os.environ.get("LOGIN_DOT_GOV_ENV") == "test":
    logindotgov_config = None
else:  # pragma: no cover
    logindotgov_config = LoginDotGovOIDCClient.discover()

DEFAULT_IAL = 2
ALLOWED_IALS = Claimant.IALOptions.values
IAL1_SCOPES = [
    "openid",
    "email",
    "profile:verified_at",
    "all_emails",
]
IAL2_SCOPES = [
    "openid",
    "email",
    "phone",
    "address",
    "profile",
    "social_security_number",
    "all_emails",
]


def logindotgov_client():
    client = LoginDotGovOIDCClient(
        client_id=settings.LOGIN_DOT_GOV_CLIENT_ID,
        private_key=settings.LOGIN_DOT_GOV_PRIVATE_KEY,
        logger=logger,
    )
    if logindotgov_config:  # pragma: no cover
        client.config = logindotgov_config
    return client


@never_cache
def explain(request):
    if not settings.DEBUG:
        return JsonResponse({"error": "DEBUG is off"}, status=401)

    this_session = session_as_dict(request)
    return JsonResponse(this_session)


# if for any reason the claimant could not reach IAL2, they are redirected here.
@never_cache
def ial2required(request):
    # if we already have an authenticated session, redirect to frontend app
    if request.session.get("authenticated"):
        return redirect("/claimant/")

    return redirect("/ial2required/?idp=logindotgov")


@never_cache
def index(request):
    requested_ial = DEFAULT_IAL
    if "ial" in request.GET and int(request.GET["ial"]) in ALLOWED_IALS:
        requested_ial = int(request.GET["ial"])

    logger.debug("🚀 requested_ial={}".format(requested_ial))

    # if we already have an authenticated session, conditionally redirect to frontend app
    if request.session.get("authenticated"):
        whoami = request.session.get("whoami")
        # if this is a step-up within the same session, allow it.
        if whoami and int(whoami.get("IAL")) == 1 and requested_ial == 2:
            logger.debug("🚀 IAL2 step up requested")
            pass
        else:
            return redirect("/claimant/")

    # stash selection
    if "swa" in request.GET:
        request.session["swa"] = request.GET["swa"]
    if "swa_code" in request.GET:
        request.session["swa"] = request.GET["swa_code"]
    if not request.session.get("swa"):
        logger.debug("🚀 missing swa or swa_code")
        return render(
            None,
            "auth-error.html",
            {
                "error": "missing swa or swa_code parameter",
                "base_url": base_url(request),
            },
            status=403,
        )

    if not SWA.active.filter(code=request.session.get("swa")).exists():
        logger.debug("🚀 invalid SWA code")
        return handle_404(request, None)

    # remember what level we're aiming for in this request
    request.session["IAL"] = requested_ial

    # optional swa_xid is unique string passed by SWAs to xref claims with their systems.
    if "swa_xid" in request.GET:
        request.session["swa_xid"] = request.GET["swa_xid"]

    # otherwise, initiate login.gov session
    # create our session with a "state" we can use to track IdP response.
    state = secrets.token_hex(11)
    nonce = secrets.token_hex(11)
    client = logindotgov_client()
    if requested_ial == 2:
        scopes = IAL2_SCOPES
        acrs = IAL2
    else:
        scopes = IAL1_SCOPES
        acrs = IAL1

    login_url = client.build_authorization_url(
        state=state,
        nonce=nonce,
        redirect_uri=settings.LOGIN_DOT_GOV_REDIRECT_URI,
        acrs=acrs,
        scopes=scopes,
    )

    logger.debug("redirect {}".format(login_url))

    request.session["logindotgov"] = {"state": state, "nonce": nonce}

    return redirect(login_url)


# OIDC OP redirects here after auth attempt
@never_cache
def result(request):
    # it's possible that a legitimate IdP request took so long to complete
    # (e.g. when creating an account for the first time at IAL2)
    # that our session has expired in the meantime.
    # it's impossible to distinguish that scenario from a bad actor,
    # so if we don't have an existing session that matches our expectations,
    # always re-start the OIDC cycle via a redirect to our index().
    # in the legit case, the login.gov session should still be live, and it
    # will just redirect back here.
    if "IAL" not in request.session or "logindotgov" not in request.session:
        return redirect("/logindotgov/")

    client = logindotgov_client()
    try:
        auth_code, auth_state = client.validate_code_and_state(request.GET)
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return render(
            None,
            "auth-error.html",
            {"error": str(error), "base_url": base_url(request)},
            status=403,
        )

    logger.debug("code={} state={}".format(auth_code, auth_state))
    logger.debug("session: {}".format(session_as_dict(request)))
    if auth_state != request.session["logindotgov"]["state"]:
        logger.error("state mismatch")
        return render(
            None,
            "auth-error.html",
            {"error": "state mismatch", "base_url": base_url(request)},
            status=403,
        )

    tokens = client.get_tokens(auth_code)

    # TODO check for error messages
    if "access_token" not in tokens:
        logger.error("access_token missing")
        return render(
            None,
            "auth-error.html",
            {"error": "missing access_token", "base_url": base_url(request)},
            status=403,
        )

    try:
        client.validate_tokens(
            tokens, request.session["logindotgov"]["nonce"], auth_code
        )
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return render(
            None,
            "auth-error.html",
            {"error": "Error exchanging token", "base_url": base_url(request)},
            status=403,
        )

    userinfo = client.get_userinfo(tokens["access_token"])

    # if we made an IAL1 initial request, but the claimant has a "verified_at" attribute,
    # that means their account at login.gov is capable already at IAL2. Remember that.
    claimant_IAL = 2 if userinfo.get("verified_at", None) else 1

    with transaction.atomic():
        logindotgov_idp, _ = IdentityProvider.objects.get_or_create(name="login.gov")
        idp_user_xid = hash_idp_user_xid(userinfo["sub"])
        claimant, _ = Claimant.objects.get_or_create(
            idp_user_xid=idp_user_xid, idp=logindotgov_idp
        )
        claimant.events.create(
            category=Claimant.EventCategories.LOGGED_IN,
            description=request.session["IAL"],  # the level they logged in at
        )
        claimant.bump_IAL_if_necessary(claimant_IAL)
        # if there was a swa_xid, if necessary create the Claim immediately to link it
        if "swa_xid" in request.session:
            # 'swa' key must exist because we required it in index()
            swa = SWA.active.get(code=request.session["swa"])
            claim, _ = Claim.objects.get_or_create(
                swa=swa, claimant=claimant, swa_xid=request.session["swa_xid"]
            )
            claim.events.create(category=Claim.EventCategories.INITIATED_WITH_SWA_XID)

    request.session["logindotgov"]["userinfo"] = userinfo
    address = userinfo.get("address", {})
    whoami = WhoAmI(
        IAL=str(claimant_IAL),
        first_name=userinfo.get("given_name", ""),
        last_name=userinfo.get("family_name", ""),
        birthdate=userinfo.get("birthdate", ""),
        ssn=userinfo.get("social_security_number", ""),
        email=userinfo["email"],
        phone=userinfo.get("phone", ""),
        address=WhoAmIAddress(
            address1=address.get("street_address", ""),
            city=address.get("locality", ""),
            state=address.get("region", ""),
            zipcode=address.get("postal_code", ""),
        ),
        claimant_id=idp_user_xid,
        verified_at=userinfo.get("verified_at", ""),
        identity_provider=logindotgov_idp.name,
    )
    request.session["whoami"] = whoami.as_dict()

    # if they logged in at IAL1 but are immediately capable of IAL2 (already verified),
    # then "step up" now and preserve the "redirect_to" in session. This makes sure
    # we have all the IAL2 attributes available to us, and avoids displaying the
    # "you need to verify your identity" on Claim form when they already have verified.
    if request.session["IAL"] == 1 and claimant_IAL == 2:
        logger.debug("Immediate step up to IAL2 for verified user")
        return redirect("/logindotgov/?ial=2")

    # wait to set this till after we've checked IAL 1vs2 above.
    request.session["authenticated"] = True

    redirect_to = "/claimant/"
    if "redirect_to" in request.session:
        redirect_to = request.session["redirect_to"]
        del request.session["redirect_to"]
    logger.debug("redirect_to={}".format(redirect_to))

    return redirect(redirect_to)
