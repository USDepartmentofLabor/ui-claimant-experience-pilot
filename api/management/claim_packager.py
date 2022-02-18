# -*- coding: utf-8 -*-
import json
from api.claim_validator import ClaimValidator
from api.models import Claim
from django.utils import timezone
from core.exceptions import ClaimStorageError


class SchemaError(Exception):
    pass


class ClaimPackager(object):
    def __init__(self, swa, claimant, json_file, schema):
        self.swa = swa
        self.claimant = claimant
        self.schema = schema
        # json_file can be a string (path) or a filehandle
        fh = open(json_file) if isinstance(json_file, str) else json_file
        self.payload = json.load(fh)
        fh.close()
        self.validate_payload()

    def validate_payload(self):
        claim_validator = ClaimValidator(self.payload, self.schema)
        if not claim_validator.valid:
            raise SchemaError(claim_validator.errors_as_dict())
        self.payload["validated_at"] = timezone.now().isoformat()
        self.payload["$schema"] = claim_validator.schema_url

    def package(self):
        claim = Claim(swa=self.swa, claimant=self.claimant)
        claim.save()
        claim.events.create(
            category=Claim.EventCategories.SUBMITTED, description="pre-packaged"
        )
        self.payload["id"] = str(claim.uuid)
        self.payload["claimant_id"] = self.claimant.idp_user_xid
        self.payload["identity_provider"] = self.claimant.idp.name
        self.payload["swa_code"] = self.swa.code
        if not claim.write_completed(self.payload):
            raise ClaimStorageError("Failed to pre-package claim {}".format(claim.uuid))
        return claim
