# -*- coding: utf-8 -*-
from django.shortcuts import redirect
from django.http import HttpResponse, JsonResponse
import logging
import secrets
import os
from logindotgov.oidc import LoginDotGovOIDCClient, LoginDotGovOIDCError, IAL2

# import pprint

from django.conf import settings

logger = logging.getLogger("logindotgov")

if os.environ.get("LOGIN_DOT_GOV_ENV") == "test":
    logindotgov_config = None
else:  # pragma: no cover
    logindotgov_config = LoginDotGovOIDCClient.discover()


def logindotgov_client():
    client = LoginDotGovOIDCClient(
        client_id=settings.LOGIN_DOT_GOV_CLIENT_ID,
        private_key=settings.LOGIN_DOT_GOV_PRIVATE_KEY,
        logger=logger,
    )
    if logindotgov_config:  # pragma: no cover
        client.config = logindotgov_config
    return client


def explain(request):
    if not settings.DEBUG:
        return JsonResponse({"error": "DEBUG is off"}, status=401)

    this_session = {}
    for k in request.session.keys():
        this_session[k] = request.session[k]
    return JsonResponse(this_session)


def index(request):
    # if we already have a verified session, redirect to frontend app
    if request.session.get("verified"):
        return redirect("/")

    # otherwise, initiate login.gov session
    # create our session with a "state" we can use to track IdP response.
    state = secrets.token_hex(11)
    nonce = secrets.token_hex(11)
    client = logindotgov_client()
    login_url = client.build_authorization_url(
        state=state,
        nonce=nonce,
        redirect_uri=settings.LOGIN_DOT_GOV_REDIRECT_URI,
        acrs=IAL2,
        scopes=settings.LOGIN_DOT_GOV_SCOPES,
    )

    logger.debug("redirect {}".format(login_url))

    request.session["logindotgov"] = {"state": state, "nonce": nonce}

    return redirect(login_url)


# OIDC OP redirects here after auth attempt
def result(request):
    client = logindotgov_client()
    try:
        auth_code, auth_state = client.validate_code_and_state(request.GET)
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return HttpResponse(error, status=403)

    logger.debug("code={} state={}".format(auth_code, auth_state))
    if auth_state != request.session["logindotgov"]["state"]:
        logger.error("state mismatch")
        return HttpResponse("state mismatch", status=403)

    tokens = client.get_tokens(auth_code)

    # TODO check for error messages
    if "access_token" not in tokens:
        return HttpResponse(tokens, status=403)

    try:
        client.validate_tokens(
            tokens, request.session["logindotgov"]["nonce"], auth_code
        )
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return HttpResponse("Error exchanging token", status=403)

    userinfo = client.get_userinfo(tokens["access_token"])

    # logger.debug("userinfo={}".format(pprint.pformat(userinfo)))

    request.session["verified"] = True
    request.session["logindotgov"]["userinfo"] = userinfo
    # TODO standardize on a WhoAmI class structure for serializing all IdPs attributes.
    request.session["whoami"] = {
        "first_name": userinfo["given_name"],
        "last_name": userinfo["family_name"],
        "birthdate": userinfo["birthdate"],
        "ssn": userinfo["social_security_number"],
        "email": userinfo["email"],
        "phone": userinfo["phone"],
    }

    redirect_to = "/logindotgov/explain"
    if "redirect_to" in request.session:
        redirect_to = request.session["redirect_to"]
        del request.session["redirect_to"]
    logger.debug("redirect_to={}".format(redirect_to))

    return redirect(redirect_to)
