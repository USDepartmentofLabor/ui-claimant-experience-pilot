# -*- coding: utf-8 -*-
from django.shortcuts import redirect, render
from django.http import JsonResponse
from django.views.decorators.cache import never_cache
from django.db import transaction
from django.core.cache import cache
import logging
import secrets
import os
import core.context_processors
import appoptics_apm
from logindotgov.oidc import LoginDotGovOIDCClient, LoginDotGovOIDCError, IAL2, IAL1
from core.utils import session_as_dict, hash_idp_user_xid, get_session
from api.models import Claimant, IdentityProvider, SWA, Claim
from api.models.claim import DuplicateSwaXid
from django.conf import settings
from api.whoami import WhoAmI, WhoAmIAddress, WhoAmISWA
from home.views import handle_404
from api.identity_claim_maker import IdentityClaimMaker, IdentityClaimValidationError
from core.exceptions import ClaimStorageError
from core.swa_xid import SwaXid

logger = logging.getLogger("logindotgov")

if os.environ.get("LOGIN_DOT_GOV_ENV") == "test":
    logindotgov_config = None
else:  # pragma: no cover
    logindotgov_config = LoginDotGovOIDCClient.discover()

DEFAULT_IAL = 1
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


# redirect to the relevant login profile page
@never_cache
def profile(request):
    login_url = LoginDotGovOIDCClient.get_url()
    return redirect(f"{login_url}/account")


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
        whoami = WhoAmI.from_dict(request.session.get("whoami"))
        redirect_to = (
            "/identity/" if whoami.swa.featureset == "Identity Only" else "/claimant/"
        )
        return redirect(f"{redirect_to}?idp=logindotgov&ial2error=true")

    return render(request, "auth-error.html", {"error": "ial2required"}, status=403)


@never_cache
def index(request):
    requested_ial = DEFAULT_IAL
    if "ial" in request.GET and int(request.GET["ial"]) in ALLOWED_IALS:
        requested_ial = int(request.GET["ial"])

    logger.debug("🚀 requested_ial={}".format(requested_ial))

    # if we already have an authenticated session, conditionally redirect to frontend app
    if request.session.get("authenticated"):
        whoami = WhoAmI.from_dict(request.session.get("whoami"))
        logger.debug("🚀  authenticated as whoami=={}".format(whoami.as_dict()))
        # if this is a step-up within the same session, allow it.
        if int(whoami.IAL) == 1 and requested_ial == 2:
            logger.debug("🚀 IAL2 step up requested")
            pass
        else:
            redirect_to = (
                "/identity/"
                if whoami.swa.featureset == "Identity Only"
                else "/claimant/"
            )
            return redirect(redirect_to)

    # stash selection
    if "swa" in request.GET:
        request.session["swa"] = request.GET["swa"]
    if "swa_code" in request.GET:
        request.session["swa"] = request.GET["swa_code"]
    if not request.session.get("swa"):
        logger.debug("🚀 missing swa or swa_code")
        return handle_404(request, None)

    try:
        swa = SWA.active.get(code=request.session.get("swa"))
    except SWA.DoesNotExist:
        logger.debug("🚀 invalid SWA code")
        return handle_404(request, None)

    # remember what level we're aiming for in this request
    request.session["IAL"] = requested_ial

    # swa_xid is unique string passed by SWAs to xref claims with their systems.
    # if the swa is an Identity Only featureset, swa_xid is required. otherwise, optional.
    # The swa_xid is optional on ial=2 because we assume we captured it already at ial=1
    swa_xid = get_swa_xid(request)
    if swa_xid:
        sx = SwaXid(swa_xid, swa.code)
        if not sx.format_ok():
            logger.debug("Malformed swa_xid: {}".format(swa_xid))
            return render(
                request,
                "malformed-swa-xid.html",
                {
                    "swa": swa,
                    "swa_xid": swa_xid,
                    "swa_missing_xid": f"_swa/{swa.code}/missing-xid.html",
                    "more_help": f"_swa/{swa.code}/more_help.html",
                },
                status=400,
            )
        request.session["swa_xid"] = swa_xid
    elif requested_ial == 2:
        pass  # step up
    elif swa.is_identity_only():
        logger.debug("🚀 SWA.is_identity_only and missing swa_xid")
        return render(
            request,
            "missing-swa-xid.html",
            {
                "swa": swa,
                "swa_missing_xid": f"_swa/{swa.code}/missing-xid.html",
                "more_help": f"_swa/{swa.code}/more_help.html",
            },
            status=400,
        )

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
    stash_session_state(state, request.session)

    return redirect(login_url)


# there are legitimate reasons that by the time login.gov redirects to our /result
# endpoint, we might not have an active session available. Some examples:
#
# * the IAL2 proofing process took longer than our session TTL (30 minutes)
# * the AAL2 email confirmation process finished in a different browser or window
#
# We mitigate both those scenarios (and others we haven't imagined yet)
# by persisting the state, nonce and relevant session values in a cache
# for 24 hours, so we can restore the user's django session if necessary.
# The 24 hour TTL is not arbirtrary. NIST guidelines require us to force a re-auth
# after 24 hours in any case. There is no PII here, so risk is reduced.
def stash_session_state(state, session):
    stash = {
        "session_key": session.session_key,
        "params": {
            "IAL": session["IAL"],
            "swa": session["swa"],
            "swa_xid": session.get("swa_xid", None),
        },
        "logindotgov": session["logindotgov"],
    }
    cache.set(state, stash, 86400)


# OIDC OP redirects here after auth attempt
@never_cache
def result(request):
    client = logindotgov_client()
    try:
        auth_code, auth_state = client.validate_code_and_state(request.GET)
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return render(
            request,
            "auth-error.html",
            {"error": str(error)},
            status=403,
        )

    # if we don't have valid session available (see stash_session_state() rationale)
    # do our best to restore a valid session. If we can't, re-start the OIDC cycle.
    if "IAL" not in request.session or "logindotgov" not in request.session:
        stashed_state = cache.get(auth_state)
        if stashed_state:
            existing_session = get_session(stashed_state["session_key"])
            if existing_session:
                logger.debug("🚀 found existing active session")
                # update all keys in request.session with existing_session
                for key, value in existing_session.items():
                    request.session[key] = value
            else:
                # re-start with params from stashed_state
                old_params = stashed_state["params"]
                new_params = f"ial={old_params['IAL']}&swa={old_params['swa']}"
                if old_params["swa_xid"]:
                    new_params += f"&swa_xid={old_params['swa_xid']}"
                return redirect(f"/logindotgov/?{new_params}")
        else:
            # no stash, no session, re-start
            return redirect("/logindotgov/")

    logger.debug("code={} state={}".format(auth_code, auth_state))
    logger.debug("session: {}".format(session_as_dict(request)))
    if auth_state != request.session["logindotgov"]["state"]:
        logger.error("state mismatch")
        return render(
            request,
            "auth-error.html",
            {"error": "state mismatch"},
            status=403,
        )

    tokens = client.get_tokens(auth_code)

    # TODO check for error messages
    if "access_token" not in tokens:
        logger.error("access_token missing")
        return render(
            request,
            "auth-error.html",
            {"error": "missing access_token"},
            status=403,
        )

    try:
        client.validate_tokens(
            tokens, request.session["logindotgov"]["nonce"], auth_code
        )
    except LoginDotGovOIDCError as error:
        logger.exception(error)
        return render(
            request,
            "auth-error.html",
            {"error": "Error exchanging token"},
            status=403,
        )

    userinfo = client.get_userinfo(tokens["access_token"])
    redirect_response = initiate_claimant_session(request, userinfo)
    base_url = core.context_processors.base_url(request)["base_url"]
    this_site_logout = f"{base_url}/logout/"
    logout_url = client.get_logout_url(tokens, this_site_logout, secrets.token_hex(11))
    request.session["logout_url"] = logout_url

    if redirect_response:
        # preserve all cookies
        return redirect_response

    redirect_to = (
        "/identity/"
        if request.whoami.swa.featureset == "Identity Only"
        else "/claimant/"
    )
    if "redirect_to" in request.session:
        redirect_to = request.session["redirect_to"]
        del request.session["redirect_to"]
    logger.debug("redirect_to={}".format(redirect_to))

    response = redirect(redirect_to)
    response.delete_cookie("swa_xid")  # in case it was set
    return response


#########################################################################################
# private methods


def initiate_claimant_session(request, userinfo):
    # if we made an IAL1 initial request, but the claimant has a "verified_at" attribute,
    # that means their account at login.gov is capable already at IAL2. Remember that.
    claimant_IAL = 2 if userinfo.get("verified_at", None) else 1

    # the IAL for this request
    request_IAL = request.session["IAL"]

    whoami, claimant = build_whoami_and_claimant(userinfo, request_IAL, claimant_IAL)

    # 'swa' key must exist because we required it in index()
    swa = SWA.active.get(code=request.session["swa"])
    whoami.swa = WhoAmISWA(**swa.for_whoami())

    # create db artifacts, and optionally, Identity claim
    try:
        initiate_claim_with_swa_xid(request, whoami, claimant, swa)
    except DuplicateSwaXid as err:
        logger.exception(err)
        appoptics_apm.log_exception()
        return render(
            None,
            "auth-error.html",
            {"error": str(err)},
            status=500,
        )

    if (
        claimant_IAL == 2
        and request_IAL == 2
        and swa.is_identity_only()
        and claimant.pending_identity_only_claim()
    ):
        complete_identity_only_claim(whoami, claimant)

    request.session["logindotgov"]["userinfo"] = userinfo
    request.session["whoami"] = whoami.as_dict()

    # if they logged in at IAL1 but are immediately capable of IAL2 (already verified),
    # then "step up" now and preserve the "redirect_to" in session. This makes sure
    # we have all the IAL2 attributes available to us, and avoids displaying the
    # "you need to verify your identity" on Claim form when they already have verified.
    if request_IAL == 1 and claimant_IAL == 2:
        logger.debug("Immediate step up to IAL2 for verified user")
        return redirect("/logindotgov/?ial=2")

    # wait to set this till after we've checked IAL 1vs2 above.
    request.session["authenticated"] = True
    request.whoami = whoami

    # None return value means caller can proceed without redirecting immediately.
    return None


def get_swa_xid(request):
    if "swa_xid" in request.GET:
        return request.GET["swa_xid"]
    if "swa_xid" in request.COOKIES:
        return request.COOKIES["swa_xid"]
    if "swa_xid" in request.session:
        return request.session["swa_xid"]
    return False


def initiate_claim_with_swa_xid(request, whoami, claimant, swa):
    swa_xid = get_swa_xid(request)
    if swa_xid:
        claim = Claim.initiate_with_swa_xid(swa, claimant, swa_xid)
        whoami.claim_id = str(claim.uuid)


def complete_identity_only_claim(whoami, claimant):
    claim = claimant.pending_identity_only_claim()
    claim_maker = IdentityClaimMaker(claim, whoami)
    try:
        claim_maker.create()
    except (ClaimStorageError, IdentityClaimValidationError) as error:
        # log and continue
        logger.exception(error)


def build_whoami_and_claimant(userinfo, request_IAL, claimant_IAL):
    with transaction.atomic():
        logindotgov_idp, _ = IdentityProvider.objects.get_or_create(name="login.gov")
        idp_user_xid = hash_idp_user_xid(userinfo["sub"])
        claimant, _ = Claimant.objects.get_or_create(
            idp_user_xid=idp_user_xid, idp=logindotgov_idp
        )
        claimant.events.create(
            category=Claimant.EventCategories.LOGGED_IN,
            description=request_IAL,
        )
        claimant.bump_IAL_if_necessary(claimant_IAL)

    address = userinfo.get("address", {})
    # split street address into 1/2 based on presence of newline
    if "\n" in address.get("street_address", ""):
        address["address1"] = address["street_address"].split("\n")[0]
        address["address2"] = address["street_address"].split("\n")[1]
    whoami = WhoAmI(
        IAL=str(claimant_IAL),
        first_name=userinfo.get("given_name", ""),
        last_name=userinfo.get("family_name", ""),
        birthdate=userinfo.get("birthdate", ""),
        ssn=userinfo.get("social_security_number", ""),
        email=userinfo["email"],
        phone=userinfo.get("phone", ""),
        address=WhoAmIAddress(
            address1=address.get("address1", address.get("street_address", "")),
            address2=address.get("address2", ""),
            city=address.get("locality", ""),
            state=address.get("region", ""),
            zipcode=address.get("postal_code", ""),
        ),
        claimant_id=idp_user_xid,
        verified_at=str(userinfo.get("verified_at", "")),
        identity_provider=logindotgov_idp.name,
    )
    return whoami, claimant
