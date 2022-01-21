# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from core.test_utils import create_s3_bucket


class Command(BaseCommand):
    help = "Create an S3 bucket in localstack"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dol",
            action="store_true",
            help="Should create the DOL archive bucket",
        )

    def handle(self, *args, **options):
        if not options["dol"]:
            create_s3_bucket()
        else:
            create_s3_bucket(is_archive=True)
