# -*- coding: utf-8 -*-
from .models import Claim, SWA, Claimant


"""
Create a Claim and related artifact for a Claimant+SWA

NOTE that this class does not attempt to prevent "duplicate" Claim
objects so use ClaimFinder before using this class.

NOTE that this class does not attempt to validate the (optional) payload
before writing its artifact, so use ClaimValidator before using this class.
"""


class ClaimMaker(object):
    def __init__(self, swa: SWA, claimant: Claimant):
        self.swa = swa
        self.claimant = claimant

    # returns a Claim and its partial artifact
    def create(self, email, payload={}):
        claim = Claim(swa=self.swa, claimant=self.claimant)
        claim.save()
        # minimal properties, always in sync with claim/swa/claimant/whoami
        payload["id"] = str(claim.uuid)
        payload["email"] = email
        payload["swa_code"] = self.swa.code
        payload["claimant_id"] = self.claimant.idp_user_xid
        claim.write_partial(payload)
        return claim, payload
