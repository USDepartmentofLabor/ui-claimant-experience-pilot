# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.models import SWA


class Command(BaseCommand):
    help = "De-activate SWA record"

    def add_arguments(self, parser):
        parser.add_argument(
            "swa_code", nargs=1, type=str, help="Two-letter code for the SWA"
        )

    def handle(self, *args, **options):
        swa = SWA.objects.get(code=options["swa_code"][0])
        swa.status = SWA.StatusOptions.INACTIVE
        swa.save()
