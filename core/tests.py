# -*- coding: utf-8 -*-
from unittest.mock import patch
import boto3
from botocore.stub import Stubber
from django.test import TestCase, Client
from core.email import Email
from django.core import mail
from api.test_utils import create_idp, create_swa, create_claimant
from api.models import Claim
from .claim_storage import ClaimWriter, ClaimReader
from jwcrypto import jwe
from jwcrypto.common import json_encode, json_decode
from .claim_encryption import (
    PackagedClaim,
    ALG as EncryptionALG,
    ENC as EncryptionENC,
    AsymmetricClaimEncryptor,
    AsymmetricClaimDecryptor,
)
from .test_utils import create_s3_bucket, delete_s3_bucket, generate_keypair
import logging


logger = logging.getLogger(__name__)


class CoreTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    def test_claimant_page(self):
        response = self.client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)

    def test_email(self):
        to = "fake@example.com"
        Email(to=to, subject="test", body="hello world").send()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "test")

    def test_404(self):
        resp = self.client.get("/route-that-does-not-exist")
        self.assertContains(resp, "Sorry, we could not find that page", status_code=404)

    def test_500(self):
        c = Client(raise_request_exception=False)
        resp = c.get("/500/")
        self.assertContains(resp, "Sorry, we had a problem", status_code=500)

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


class CoreClaimStorageTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def test_claim_writer(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()

        cw = ClaimWriter(claim, "test payload")
        self.assertTrue(cw.write())

        cr = ClaimReader(claim)
        bucket_asset = cr.read()
        self.assertEqual(bucket_asset, "test payload")

        # explicit path declaration
        cw = ClaimWriter(claim, "test path", "path/to/my/object")
        self.assertTrue(cw.write())

        cr = ClaimReader(claim, "path/to/my/object")
        bucket_asset = cr.read()
        self.assertEqual(bucket_asset, "test path")

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


class CoreClaimEncryptionTestCase(TestCase):
    def test_asymmetric_claim_encryptor(self):
        private_key_jwk, public_key_jwk = generate_keypair()
        claim = {"id": "123-abc", "foo": "something-really-private-and-sensitive"}
        ce = AsymmetricClaimEncryptor(claim, public_key_jwk)
        self.assertEqual(ce.protected_header()["alg"], EncryptionALG)
        self.assertEqual(ce.protected_header()["enc"], EncryptionENC)
        packaged_claim = ce.packaged_claim()
        self.assertIsInstance(
            packaged_claim, PackagedClaim, "object is a PackagedClaim"
        )

        claim_dict = packaged_claim.as_dict()
        self.assertEqual(claim_dict["claim_id"], "123-abc")
        self.assertNotIn("foo", claim_dict["claim"]["ciphertext"])
        self.assertNotIn(
            "something-really-private-and-sensitive",
            claim_dict["claim"]["ciphertext"],
        )

        # round-trip: decrypt
        jwetoken = jwe.JWE()
        jwetoken.deserialize(json_encode(claim_dict["claim"]), key=private_key_jwk)
        decrypted_claim = json_decode(jwetoken.payload)
        self.assertEqual(decrypted_claim, claim)

        # allows for PEM key as bytes or str
        private_key_pem = private_key_jwk.export_to_pem(True, None)
        public_key_pem = public_key_jwk.export_to_pem()

        ce = AsymmetricClaimEncryptor(claim, public_key_pem)
        packaged_claim = ce.packaged_claim()
        cd = AsymmetricClaimDecryptor(packaged_claim.as_json(), private_key_pem)
        decrypted_claim = cd.decrypt()
        self.assertEqual(decrypted_claim["id"], "123-abc")

        ce = AsymmetricClaimEncryptor(claim, public_key_pem.decode("utf-8"))
        packaged_claim = ce.packaged_claim()
        cd = AsymmetricClaimDecryptor(
            packaged_claim.as_json(), private_key_pem.decode("utf-8")
        )
        decrypted_claim = cd.decrypt()
        self.assertEqual(decrypted_claim["id"], "123-abc")
