# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.management.claimant_key_rotator import ClaimantKeyRotator
from core.claim_encryption import (
    symmetric_encryption_key,
)


class Command(BaseCommand):
    help = "Rotate Claim symmetrical encryption keys"

    def add_arguments(self, parser):
        parser.add_argument("old_key", nargs=1, type=str, help="old CLAIM_SECRET_KEY")
        parser.add_argument("new_key", nargs=1, type=str, help="new CLAIM_SECRET_KEY")

    def handle(self, *args, **options):
        ckr = ClaimantKeyRotator(
            old_key=symmetric_encryption_key(options["old_key"][0]),
            new_key=symmetric_encryption_key(options["new_key"][0]),
        )
        total_rotated = ckr.rotate()
        print("{} artifacts rotated".format(total_rotated))
