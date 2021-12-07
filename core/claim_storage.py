# -*- coding: utf-8 -*-
# wrapper around boto3 to read/write to a S3 bucket with consistent naming conventions
import boto3
from botocore.exceptions import ClientError
import logging
import os
from django.conf import settings
from django.db import transaction


logger = logging.getLogger(__name__)


class ClaimStore(object):
    def __init__(self, bucket_name=None):
        if bucket_name:  # pragma: no cover
            self.bucket_name = bucket_name
        else:
            self.bucket_name = (
                settings.TEST_CLAIM_BUCKET_NAME
                if os.environ.get("RUNNING_TESTS")
                else settings.CLAIM_BUCKET_NAME
            )

    def s3_client(self):
        # TODO region?
        return boto3.client("s3", endpoint_url=settings.AWS_S3_ENDPOINT_URL)

    def bucket(self):
        return boto3.resource("s3", endpoint_url=settings.AWS_S3_ENDPOINT_URL).Bucket(
            self.bucket_name
        )

    def write(self, path, payload):
        return self.s3_client().put_object(
            Bucket=self.bucket_name, Key=path, Body=payload
        )

    def read(self, path):
        return self.s3_client().get_object(Bucket=self.bucket_name, Key=path)

    def delete(self, paths):
        try:
            payload = {"Objects": list(map(lambda path: {"Key": path}, paths))}
            resp = self.bucket().delete_objects(Delete=payload)
        except ClientError as e:
            logger.exception(e)
            return False
        return resp


class ClaimWriter(object):
    def __init__(self, claim, payload, path=None):
        self.claim_store = ClaimStore()
        self.claim = claim
        self.payload = payload
        if path:
            self.path = path
        elif hasattr(claim, "payload_path"):
            self.path = claim.payload_path()
        else:
            raise ValueError("Must provide path or a Claim object")

    def write(self):
        try:
            with transaction.atomic():
                self.claim_store.write(self.path, self.payload)
                self.claim.create_stored_event()
        except ClientError as e:
            logger.exception(e)
            return False
        return True


class ClaimReader(object):
    def __init__(self, claim, path=None):
        self.claim_store = ClaimStore()
        self.claim = claim
        if path:
            self.path = path
        elif hasattr(claim, "payload_path"):
            self.path = claim.payload_path()
        else:
            raise ValueError("Must provide path or a Claim object")

    def read(self):
        try:
            return self.claim_store.read(self.path)["Body"].read().decode("utf-8")
        except ClientError as e:
            logger.exception(e)
            return False

    def exists(self):
        try:
            return "Body" in self.claim_store.read(self.path)
        except ClientError:
            # no logging since we only care about binary true/false
            # and it's "normal" to return false
            return False
