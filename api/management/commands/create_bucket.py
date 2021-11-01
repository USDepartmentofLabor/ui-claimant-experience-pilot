# -*- coding: utf-8 -*-
from django.core.management.base import BaseCommand
from core.test_utils import create_s3_bucket


class Command(BaseCommand):
    help = "Create S3 bucket in localstack"

    def handle(self, *args, **options):
        create_s3_bucket()
