# -*- coding: utf-8 -*-
from .models import Claim, SWA, Claimant
from .whoami import WhoAmI
import logging

logger = logging.getLogger(__name__)


class ClaimFinder(object):
    def __init__(self, whoami: WhoAmI):
        self.whoami = whoami
        self.ok = self.__find_swa_and_claimant()

    def __find_swa_and_claimant(self):
        if not self.whoami.claimant_id:
            logger.debug("🚀 missing whoami.claimant_id")
            return False
        if not self.whoami.swa:
            logger.debug("🚀 missing whoami.swa")
            return False
        try:
            self.claimant = Claimant.objects.get(idp_user_xid=self.whoami.claimant_id)
        except Claimant.DoesNotExist:
            return False
        try:
            self.swa = SWA.objects.get(code=self.whoami.swa.code)
        except SWA.DoesNotExist:
            return False
        return True

    def find(self):
        logger.debug("🚀 whoami: {}".format(self.whoami))
        if self.whoami.claim_id:
            logger.debug("🚀 find by claim_id {}".format(self.whoami.claim_id))
            try:
                return Claim.objects.get(uuid=self.whoami.claim_id)
            except Claim.DoesNotExist:
                return False

        if not self.ok:
            return False

        # get the most recent regardless of status
        # TODO is this what consumers expect?
        # revisit once we have multiple claims per claimant.
        return (
            Claim.objects.filter(swa=self.swa, claimant=self.claimant)
            .exclude(
                events__category__in=[
                    Claim.EventCategories.FETCHED,
                    Claim.EventCategories.RESOLVED,
                ]
            )
            .order_by("created_at")
            .last()
        )

    def all(self):
        if not self.ok:
            return False

        return Claim.objects.filter(swa=self.swa, claimant=self.claimant).order_by(
            "-created_at"
        )
