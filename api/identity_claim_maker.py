# -*- coding: utf-8 -*-

# create, validate, store an Identity Only claim

from django.utils import timezone
from .claim_validator import ClaimValidator
from .models import Claim
from core.exceptions import ClaimStorageError


class IdentityClaimValidationError(Exception):
    pass


class IdentityClaimMaker(object):
    def __init__(self, claim, whoami, schema_name="identity-v1.0"):
        self.whoami = whoami
        self.claim = claim
        self.schema_name = schema_name

    def create(self):
        identity_payload = self.whoami.as_identity()
        identity_payload["swa_code"] = self.whoami.swa.code
        identity_payload["claimant_id"] = self.claim.claimant.idp_user_xid
        identity_payload["id"] = str(self.claim.uuid)
        if self.claim.swa_xid:
            identity_payload["swa_xid"] = self.claim.swa_xid

        claim_validator = ClaimValidator(identity_payload, schema_name=self.schema_name)
        if not claim_validator.valid:
            raise IdentityClaimValidationError(claim_validator.errors_as_dict())
        else:
            identity_payload["validated_at"] = timezone.now().isoformat()
            identity_payload["$schema"] = claim_validator.schema_url

        self.claim.events.create(category=Claim.EventCategories.SUBMITTED)
        if not self.claim.write_completed(identity_payload):
            raise ClaimStorageError("failed to write Identity claim")
        return True
