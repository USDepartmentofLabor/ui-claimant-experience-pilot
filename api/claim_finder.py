# -*- coding: utf-8 -*-
from .models import Claim, SWA, Claimant
from .whoami import WhoAmI
import logging

logger = logging.getLogger(__name__)


class ClaimFinder(object):
    def __init__(self, whoami: WhoAmI):
        self.whoami = whoami

    def find(self):
        logger.debug("🚀 whoami: {}".format(self.whoami))
        if self.whoami.claim_id:
            logger.debug("🚀 find by claim_id {}".format(self.whoami.claim_id))
            try:
                return Claim.objects.get(uuid=self.whoami.claim_id)
            except Claim.DoesNotExist:
                return False
        if not self.whoami.claimant_id or not self.whoami.swa_code:
            logger.debug("🚀 missing one of: claimant_id or swa_code")
            return False
        try:
            claimant = Claimant.objects.get(idp_user_xid=self.whoami.claimant_id)
        except Claimant.DoesNotExist:
            return False
        try:
            swa = SWA.objects.get(code=self.whoami.swa_code)
        except SWA.DoesNotExist:
            return False

        # get the most recent regardless of status
        # TODO is this what consumers expect?
        # revisit once we have multiple claims per claimant.
        return (
            Claim.objects.filter(swa=swa, claimant=claimant)
            .order_by("created_at")
            .last()
        )
