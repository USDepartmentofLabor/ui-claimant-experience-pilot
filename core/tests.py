# -*- coding: utf-8 -*-
from unittest.mock import patch
import boto3
from botocore.stub import Stubber
from django.test import TestCase
from core.email import Email
from django.core import mail
from api.test_utils import create_idp, create_swa, create_claimant
from api.models import Claim
from .claim_writer import ClaimWriter


class CoreTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    @classmethod
    def setUpClass(cls):
        # create our S3 bucket
        cw = ClaimWriter(True, True)
        cw.s3_client().create_bucket(Bucket=cw.bucket_name())

    @classmethod
    def tearDownClass(cls):
        # destroy bucket
        cw = ClaimWriter(True, True)
        # must delete all objects first, then delete bucket
        bucket = cw.bucket()
        bucket.objects.all().delete()
        cw.s3_client().delete_bucket(Bucket=cw.bucket_name())

    def test_claimant_page(self):
        response = self.client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)

    def test_email(self):
        to = "fake@example.com"
        Email(to=to, subject="test", body="hello world").send()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "test")

    def test_live(self):
        response = self.client.get("/live/")
        live_resp = response.json()
        self.assertTrue(live_resp["db"])
        self.assertTrue(live_resp["redis"])
        self.assertGreaterEqual(float(live_resp["db_response"]), 0)
        self.assertLess(float(live_resp["db_response"]), 1)
        self.assertGreaterEqual(float(live_resp["redis_response"]), 0)
        self.assertLess(float(live_resp["redis_response"]), 1)
        # celery not running in this test case, but we want to verify the key exists.
        self.assertFalse(live_resp["celery"])
        # status is 503 because celery is offline
        self.assertEqual(response.status_code, 503)

    def test_claim_writer(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        cw = ClaimWriter(claim, "test payload")
        self.assertTrue(cw.write())

        bucket_asset = cw.s3_client().get_object(
            Bucket=cw.bucket_name(), Key=claim.payload_path()
        )
        self.assertEqual(bucket_asset["Body"].read().decode("utf-8"), "test payload")

    @patch("core.claim_writer.ClaimWriter.s3_client")
    def test_claim_writer_error(self, mock_boto3_client):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        client = boto3.client("s3")
        stubber = Stubber(client)
        stubber.add_client_error("put_object")
        stubber.activate()
        mock_boto3_client.return_value = client

        cw = ClaimWriter(claim, "test payload")
        self.assertFalse(cw.write())
