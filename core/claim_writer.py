# -*- coding: utf-8 -*-
# wrapper around boto3 to write to a S3 bucket with consistent naming conventions
import boto3
from botocore.exceptions import ClientError
import logging
from django.conf import settings


logger = logging.getLogger(__name__)


class ClaimWriter(object):
    def __init__(self, claim, payload):
        self.claim = claim
        self.payload = payload

    def s3_client(self):
        # TODO region?
        return boto3.client("s3", endpoint_url=settings.AWS_S3_ENDPOINT_URL)

    def bucket(self):
        return boto3.resource("s3", endpoint_url=settings.AWS_S3_ENDPOINT_URL).Bucket(
            self.bucket_name()
        )

    def bucket_name(self):
        return settings.CLAIM_BUCKET_NAME

    def write(self):
        try:
            self.s3_client().put_object(
                Bucket=self.bucket_name(),
                Key=self.claim.payload_path(),
                Body=self.payload,
            )
            # TODO mark claim event as written
        except ClientError as e:
            logger.exception(e)
            return False
        return True
