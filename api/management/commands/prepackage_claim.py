# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from api.management.claim_packager import ClaimPackager
from api.models import SWA, Claimant, IdentityProvider


class Command(BaseCommand):
    help = "Create a pre-packaged Claim for SWA+Claimant"

    def add_arguments(self, parser):
        parser.add_argument(
            "swa_code", nargs=1, type=str, help="Two-letter code for the SWA"
        )
        parser.add_argument(
            "claimant_id", nargs=1, type=str, help="Claimant.idp_user_xid value"
        )
        parser.add_argument("idp", nargs=1, type=str, help="IDP.name value")
        parser.add_argument(
            "json_file",
            nargs=1,
            type=str,
            help="path to the plaintext .json file containing the claim artifact",
        )
        parser.add_argument(
            "schema",
            nargs=1,
            type=str,
            help="name of the schema file (no path or .json extension)",
        )

    def handle(self, *args, **options):
        swa = SWA.active.get(code=options["swa_code"][0])
        idp = IdentityProvider.objects.get(name=options["idp"][0])
        claimant, _ = Claimant.objects.get_or_create(
            idp_user_xid=options["claimant_id"][0], idp=idp
        )
        packager = ClaimPackager(
            swa=swa,
            claimant=claimant,
            json_file=options["json_file"][0],
            schema=options["schema"][0],
        )
        claim = packager.package()
        print("Claim {} created".format(claim.uuid))
