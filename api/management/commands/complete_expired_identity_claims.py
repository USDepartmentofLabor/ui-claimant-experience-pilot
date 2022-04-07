# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.models import Claim


class Command(BaseCommand):
    help = "Re-write expired partial (IAL1) identity claims as completed"

    def handle(self, *args, **options):
        Claim.expired_identity_claims.complete_all()
