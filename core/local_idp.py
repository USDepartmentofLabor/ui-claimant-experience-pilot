# -*- coding: utf-8 -*-

# pseudo identity provider for Local login (testing only)
import json
import logging
from api.models import Claimant, Claim, SWA
from api.whoami import WhoAmI
from api.identity_claim_maker import IdentityClaimMaker, IdentityClaimValidationError
from api.claim_finder import ClaimFinder
from core.exceptions import ClaimStorageError, MissingSwaXidError, MalformedSwaXidError
from core.utils import local_identity_provider, hash_idp_user_xid
from core.swa_xid import SwaXid
from django.utils import timezone
from django.db import transaction


logger = logging.getLogger(__name__)


class LocalIdentityProviderError(Exception):
    pass


class LocalIdentityProvider(object):
    def __init__(self, request):
        self.request = request

    def build_whoami_and_claimant(self):
        if self.request.content_type == "application/json":
            payload = json.loads(self.request.body)
        else:
            payload = self.request.POST

        params = {}
        for k in payload.keys():
            if "." in k:
                k_parts = k.split(".")
                if k_parts[0] not in params:
                    params[k_parts[0]] = {}
                params[k_parts[0]][k_parts[1]] = payload[k]
            else:
                params[k] = payload[k]

        if "swa_code" not in params:
            raise LocalIdentityProviderError("swa_code required")

        swa = SWA.active.get(code=params["swa_code"])
        params["swa"] = swa.for_whoami()
        del params["swa_code"]

        if params["IAL"] == "2":
            params["verified_at"] = str(timezone.now().isoformat())

        local_idp = local_identity_provider()
        params["identity_provider"] = local_idp.name

        if "email" not in params:
            raise LocalIdentityProviderError("email is required")

        user_xid = hash_idp_user_xid(params["email"])
        with transaction.atomic():
            claimant, _ = Claimant.objects.get_or_create(
                idp_user_xid=user_xid, idp=local_idp
            )
            claimant.events.create(
                category=Claimant.EventCategories.LOGGED_IN,
                description=params["IAL"],
            )
            claimant.bump_IAL_if_necessary(params["IAL"])
        params["claimant_id"] = user_xid

        swa_xid = self.get_swa_xid(params)
        claim = False

        if swa_xid:
            sx = SwaXid(swa_xid, swa.code)
            if not sx.format_ok():
                raise MalformedSwaXidError(swa, swa_xid)
            claim = Claim.initiate_with_swa_xid(swa, claimant, swa_xid)
            params["claim_id"] = str(claim.uuid)
            params.pop("swa_xid", None)  # delete if exists
            self.request.session["swa_xid"] = swa_xid

        self.whoami = WhoAmI.from_dict(params)
        self.claimant = claimant

        if swa.is_identity_only() and not claim:
            claim = ClaimFinder(self.whoami).find()
            if claim:
                self.whoami.claim_id = str(claim.uuid)
            else:
                raise MissingSwaXidError(
                    swa, "SWA {} is identity only, but missing swa_xid".format(swa.name)
                )

    def get_swa_xid(self, params):
        if "swa_xid" in params:
            return params["swa_xid"]
        if "swa_xid" in self.request.COOKIES:
            return self.request.COOKIES["swa_xid"]
        if "swa_xid" in self.request.session:
            return self.request.session["swa_xid"]
        return False

    def initiate_session(self):
        self.build_whoami_and_claimant()
        self.request.session["whoami"] = self.whoami.as_dict()
        self.request.session["authenticated"] = True
        if (
            self.whoami.IAL == "2"
            and self.whoami.swa.featureset == "Identity Only"
            and self.claimant.pending_identity_only_claim()
        ):
            logger.debug("🚀 create Identity claim")
            claim = self.claimant.pending_identity_only_claim()
            claim_maker = IdentityClaimMaker(claim, self.whoami)
            try:
                claim_maker.create()
            except (ClaimStorageError, IdentityClaimValidationError) as error:
                # log and continue
                logger.exception(error)

    def login(self):
        self.initiate_session()
        return self.whoami
