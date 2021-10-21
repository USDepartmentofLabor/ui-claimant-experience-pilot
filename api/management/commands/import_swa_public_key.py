# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand, CommandError
from api.models import SWA
from jwcrypto import jwk


class Command(BaseCommand):
    help = "Import a RSA public key to the specified SWA record"

    def add_arguments(self, parser):
        parser.add_argument(
            "swa_code", nargs=1, type=str, help="Two-letter code for the SWA"
        )
        parser.add_argument(
            "public_pem_file", nargs=1, type=str, help="Path to the .pem file"
        )
        parser.add_argument(
            "--rotate",
            action="store_true",
            help="Ok to overwrite existing public_key value",
        )

    def handle(self, *args, **options):
        print("options={}".format(options))
        public_pem = ""
        with open(options["public_pem_file"][0], "rb") as pf:
            public_pem = pf.read()

        public_key = jwk.JWK.from_pem(public_pem)
        swa = SWA.objects.get(code=options["swa_code"][0])
        if not options["rotate"] and swa.public_key:
            raise CommandError(
                "SWA {} already has public_key defined -- maybe you want --rotate option".format(
                    swa.code
                )
            )
        swa.public_key = public_pem.decode("utf-8")
        swa.public_key_fingerprint = public_key.thumbprint()
        swa.save()
