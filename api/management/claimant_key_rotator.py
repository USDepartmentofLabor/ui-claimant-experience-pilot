# -*- coding: utf-8 -*-
from django.db import transaction
from api.models import Claimant
from core.claim_encryption import (
    SymmetricKeyRotator,
    encryption_key_hash,
)

"""

Administrative task helper. Given an old key and new key,
find all the claimant records that use the old key and rotate them
to use the new key.

"""


class ClaimantKeyRotator(object):
    def __init__(self, old_key, new_key):
        self.old_key = old_key
        self.old_key_hash = encryption_key_hash(old_key)
        self.new_key = new_key
        self.new_key_hash = encryption_key_hash(new_key)

    def rotate(self):
        rotator = SymmetricKeyRotator(self.old_key, self.new_key)
        total_rotated = 0
        for claimant in self.find_claimants():
            with transaction.atomic():
                total_rotated += rotator.rotate_artifacts_for_claimant(claimant)
                claimant.encryption_key_hash = self.new_key_hash
                claimant.save()
        return total_rotated

    def find_claimants(self):
        queryset = Claimant.objects.filter(
            encryption_key_hash=self.old_key_hash
        ) | Claimant.objects.filter(encryption_key_hash__isnull=True)
        return queryset.all()
