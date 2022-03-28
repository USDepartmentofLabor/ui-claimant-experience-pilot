# -*- coding: utf-8 -*-
from unittest.mock import patch
import boto3
from botocore.stub import Stubber
from api.test_utils import create_idp, create_swa, create_claimant
from api.models import Claim

from core.claim_storage import ClaimWriter, ClaimReader, ClaimStore, ClaimBucket
from core.claim_encryption import (
    SymmetricClaimEncryptor,
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
from core.test_utils import BucketableTestCase
import logging


logger = logging.getLogger(__name__)


class CoreClaimStorageTestCase(BucketableTestCase):
    def test_claim_writer(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        cw = ClaimWriter(claim, "test payload")
        self.assertTrue(cw.write())
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STORED).count(), 1
        )

        cr = ClaimReader(claim)
        bucket_asset = cr.read()
        self.assertEqual(bucket_asset, "test payload")

        # explicit path declaration
        cw = ClaimWriter(claim, "test path", "path/to/my/object")
        self.assertTrue(cw.write())
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STORED).count(), 2
        )

        cr = ClaimReader(claim, "path/to/my/object")
        bucket_asset = cr.read()
        self.assertEqual(bucket_asset, "test path")

    def test_claim_writer_with_sym_encryption(self):
        key = symmetric_encryption_key()
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        claim_payload = {
            "id": str(claim.uuid),
            "foo": "something-really-private-and-sensitive",
        }
        ce = SymmetricClaimEncryptor(claim_payload, key)
        packaged_claim = ce.packaged_claim()
        cw = ClaimWriter(claim, packaged_claim.as_json())
        self.assertTrue(cw.write())

        cr = ClaimReader(claim)
        packaged_claim_str = cr.read()
        cd = SymmetricClaimDecryptor(packaged_claim_str, key)
        decrypted_claim = cd.decrypt()
        self.assertEqual(decrypted_claim, claim_payload)

    def test_claim_storage_exceptions(self):
        with self.assertRaises(ValueError) as context:
            ClaimWriter(True, True)
        self.assertIn("Must provide path or a Claim object", str(context.exception))

        with self.assertRaises(ValueError) as context:
            ClaimReader(True)
        self.assertIn("Must provide path or a Claim object", str(context.exception))

        self.assertFalse(ClaimReader(Claim(), "no/path").read())

    @patch("core.claim_storage.ClaimStore.s3_client")
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

    @patch("core.claim_storage.ClaimStore.bucket")
    def test_claim_storage_delete_error(self, mock_boto3_bucket):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        bucket = boto3.resource("s3").Bucket("no-such-bucket")
        stubber = Stubber(bucket.meta.client)
        stubber.add_client_error("delete_objects")
        stubber.activate()
        mock_boto3_bucket.return_value = bucket

        cs = ClaimStore()
        self.assertFalse(cs.delete("foo"))

    def test_claim_bucket_type(self):
        with self.assertRaises(ValueError):
            ClaimBucket(bucket_type="foobar")
