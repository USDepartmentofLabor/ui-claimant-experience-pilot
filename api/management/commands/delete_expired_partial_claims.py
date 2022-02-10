# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.models import Claim


class Command(BaseCommand):
    help = "Delete artifacts for expired partial claims"

    def handle(self, *args, **options):
        Claim.expired_partial_claims.delete_artifacts()
