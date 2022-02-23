# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.models import SWA


class Command(BaseCommand):
    help = "Create a SWA record"

    def add_arguments(self, parser):
        parser.add_argument(
            "swa_code", nargs=1, type=str, help="Two-letter code for the SWA"
        )
        parser.add_argument("swa_name", nargs=1, type=str, help="Name of the SWA")
        parser.add_argument(
            "claimant_url", nargs=1, type=str, help="URL of the SWA Claimant URL"
        )
        parser.add_argument(
            "--featureset",
            nargs=1,
            type=int,
            help="The featureset enum value (optional -- default is 1)",
        )

    def handle(self, *args, **options):
        swa = SWA(
            code=options["swa_code"][0],
            name=options["swa_name"][0],
            claimant_url=options["claimant_url"][0],
            featureset=(options["featureset"][0] if "featureset" in options else 1),
        )
        swa.save()
