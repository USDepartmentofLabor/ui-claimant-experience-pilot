# -*- coding: utf-8 -*-
from django.conf import settings
from .claimant_key_rotator import ClaimantKeyRotator
from .claim_packager import ClaimPackager, SchemaError
from core.claim_encryption import (
    symmetric_encryption_key,
    encryption_key_hash,
    SymmetricClaimEncryptor,
)
from core.claim_storage import ClaimWriter
from core.exceptions import ClaimStorageError
from core.test_utils import (
    BucketableTestCase,
    generate_symmetric_encryption_key,
)
from api.test_utils import create_idp, create_swa
from api.models import Claim, Claimant, ClaimantFile
import uuid
import tempfile
from unittest.mock import patch
import boto3
from botocore.stub import Stubber


class BucketTestCase(BucketableTestCase):
    def setUp(self):
        super().setUp()
        self.idp = create_idp()
        self.swa, _ = create_swa()


class ClaimPackagerTestCase(BucketTestCase):
    def test_packager(self):
        claimant = Claimant(idp=self.idp, idp_user_xid="i-am-a-test")
        claimant.save()
        example = str(settings.BASE_DIR / "schemas" / "claim-v1.0-example.json")
        packager = ClaimPackager(
            swa=self.swa, claimant=claimant, json_file=example, schema="claim-v1.0"
        )
        claim = packager.package()
        self.assertEqual(str(claim.uuid), packager.payload["id"])

    def test_invalid_json(self):
        claimant = Claimant(idp=self.idp, idp_user_xid="i-am-a-test")
        claimant.save()
        with tempfile.NamedTemporaryFile() as fp:
            fp.write(b'{"test": "invalid"}')
            fp.seek(0)
            # ClaimPackager should close the fp for us.
            with self.assertRaises(SchemaError):
                ClaimPackager(
                    swa=self.swa,
                    claimant=claimant,
                    json_file=fp.name,
                    schema="claim-v1.0",
                )

    @patch("core.claim_storage.ClaimStore.s3_client")
    def test_claim_writer_error(self, mock_boto3_client):
        client = boto3.client("s3")
        stubber = Stubber(client)
        stubber.add_client_error("put_object")
        stubber.activate()
        mock_boto3_client.return_value = client

        claimant = Claimant(idp=self.idp, idp_user_xid="i-am-a-test")
        claimant.save()
        example = str(settings.BASE_DIR / "schemas" / "claim-v1.0-example.json")
        packager = ClaimPackager(
            swa=self.swa, claimant=claimant, json_file=example, schema="claim-v1.0"
        )
        with self.assertRaises(ClaimStorageError) as context:
            packager.package()
        self.assertIn("Failed to pre-package claim", str(context.exception))


class ClaimantKeyRotatorTestCase(BucketTestCase):
    def create_claim_with_key(self, key):
        claimant = Claimant(idp=self.idp, idp_user_xid=str(uuid.uuid4()))
        claimant.save()
        claim = Claim(swa=self.swa, claimant=claimant)
        claim.save()
        payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": self.swa.code,
            "id": str(claim.uuid),
        }
        sym_encryptor = SymmetricClaimEncryptor(payload, key)
        packaged_claim = sym_encryptor.packaged_claim()
        packaged_payload = packaged_claim.as_json()
        cw = ClaimWriter(claim, packaged_payload, path=claim.partial_payload_path())
        self.assertTrue(cw.write())

        # create some with no artifacts to exercise failure logic
        completed_claim = Claim(swa=self.swa, claimant=claimant)
        completed_claim.save()
        completed_claim.events.create(category=Claim.EventCategories.COMPLETED)
        partial_claim = Claim(swa=self.swa, claimant=claimant)
        partial_claim.save()
        deleted_claim = Claim(swa=self.swa, claimant=claimant)
        deleted_claim.save()
        deleted_claim.events.create(category=Claim.EventCategories.DELETED)

        return claimant

    def create_claimant_file(self, claimant, key):
        claimant_file = ClaimantFile(
            claimant=claimant,
            year="2022",
            fileext="pdf",
            filetype=ClaimantFile.FileTypeOptions.F1099G,
            swa=self.swa,
        )
        claimant_file.save()

        payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": self.swa.code,
            "id": str(claimant_file.uuid),
        }
        sym_encryptor = SymmetricClaimEncryptor(payload, key)
        packaged_file = sym_encryptor.packaged_claim()
        packaged_payload = packaged_file.as_json()
        cw = ClaimWriter(claim=claimant_file, payload=packaged_payload)
        self.assertTrue(cw.write())
        return claimant_file

    def test_find_claimants(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_key_hash = self.create_claim_with_key(old_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        claimant_with_null_hash = self.create_claim_with_key(old_key)

        claimant_with_new_key = self.create_claim_with_key(new_key)
        claimant_with_new_key.encryption_key_hash = encryption_key_hash(new_key)
        claimant_with_new_key.save()

        ckr = ClaimantKeyRotator(old_key, new_key)
        found_claimants = ckr.find_claimants()
        self.assertTrue(claimant_with_null_hash in found_claimants)
        self.assertTrue(claimant_with_key_hash in found_claimants)
        self.assertFalse(claimant_with_new_key in found_claimants)

    def test_rotate(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_key_hash = self.create_claim_with_key(old_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        claimant_with_null_hash = self.create_claim_with_key(old_key)
        self.create_claimant_file(claimant_with_null_hash, old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 3)  # 2 claims + 1 file

        claimant_with_key_hash.refresh_from_db()
        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_old_key_null_hash_no_file(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_null_hash = self.create_claim_with_key(old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 1)  # 1 claim

        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_old_key_null_hash_with_file_old_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_null_hash = self.create_claim_with_key(old_key)
        self.create_claimant_file(claimant_with_null_hash, old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 2)  # 1 claim + 1 file

        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_old_key_hash_no_file(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_key_hash = self.create_claim_with_key(old_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 1)  # 1 claim

        claimant_with_key_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_old_key_hash_with_file_old_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant_with_key_hash = self.create_claim_with_key(old_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        self.create_claimant_file(claimant_with_key_hash, old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 2)  # 1 claim + 1 file

        claimant_with_key_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_null_hash_no_file(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_null_hash = self.create_claim_with_key(new_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 0)  # 0 claim

        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_null_hash_with_file_old_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_null_hash = self.create_claim_with_key(new_key)
        # encrypted with old key - expected to be rotated
        self.create_claimant_file(claimant_with_null_hash, old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 1)  # 0 claim + 1 file

        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_null_hash_with_file_new_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_null_hash = self.create_claim_with_key(new_key)
        self.create_claimant_file(claimant_with_null_hash, new_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 0)  # 0 claim + 0 file

        claimant_with_null_hash.refresh_from_db()
        self.assertEqual(claimant_with_null_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_old_hash_no_file(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_key_hash = self.create_claim_with_key(new_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 0)  # 0 claim

        claimant_with_key_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_old_hash_with_file_old_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_key_hash = self.create_claim_with_key(new_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        # encrypted with old key - expected to be rotated
        self.create_claimant_file(claimant_with_key_hash, old_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 1)  # 0 claim + 1 file

        claimant_with_key_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_one_claim_new_key_old_hash_with_file_new_key(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # encrypted with new key - not expected to be rotated
        claimant_with_key_hash = self.create_claim_with_key(new_key)
        claimant_with_key_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_with_key_hash.save()

        self.create_claimant_file(claimant_with_key_hash, new_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 0)  # 0 claim + 0 file

        claimant_with_key_hash.refresh_from_db()
        self.assertEqual(claimant_with_key_hash.encryption_key_hash, ckr.new_key_hash)

    def test_rotate_many_things(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        # +1 claim
        claimant_old_key_null_hash = self.create_claim_with_key(old_key)
        # +2 files
        self.create_claimant_file(claimant_old_key_null_hash, old_key)
        self.create_claimant_file(claimant_old_key_null_hash, old_key)

        # +1 claim
        claimant_old_key_with_hash = self.create_claim_with_key(old_key)
        claimant_old_key_with_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_old_key_with_hash.save()
        # +1 file
        self.create_claimant_file(claimant_old_key_with_hash, old_key)

        # +0 claims
        claimant_new_key_null_hash = self.create_claim_with_key(new_key)
        # +0 files
        self.create_claimant_file(claimant_new_key_null_hash, new_key)
        self.create_claimant_file(claimant_new_key_null_hash, new_key)
        self.create_claimant_file(claimant_new_key_null_hash, new_key)

        # +0 claims
        claimant_new_key_with_hash = self.create_claim_with_key(new_key)
        claimant_new_key_with_hash.encryption_key_hash = encryption_key_hash(old_key)
        claimant_new_key_with_hash.save()
        # +2 files - expect these to be rotated because encrypted with old key;
        # but not an expected use case
        self.create_claimant_file(claimant_new_key_with_hash, old_key)
        self.create_claimant_file(claimant_new_key_with_hash, old_key)
        # +0 files - not expected to be rotated because encrypted with new key
        self.create_claimant_file(claimant_new_key_with_hash, new_key)

        # +0 claim - not expected to be rotated because encrypted with new
        # key; not expected that a claimant would have the new_key hash
        # prior to key rotation
        claimant_new_key_with_new_key_hash = self.create_claim_with_key(new_key)
        claimant_new_key_with_new_key_hash.encryption_key_hash = encryption_key_hash(
            new_key
        )
        claimant_new_key_with_new_key_hash.save()
        # +0 files - not expected to be rotated because claimant has new_key
        # hash; not an expected use case
        self.create_claimant_file(claimant_new_key_with_new_key_hash, old_key)
        self.create_claimant_file(claimant_new_key_with_new_key_hash, new_key)
        self.create_claimant_file(claimant_new_key_with_new_key_hash, new_key)

        ckr = ClaimantKeyRotator(old_key, new_key)
        self.assertEqual(ckr.rotate(), 7)  # 2 claims, 5 files

        claimant_old_key_null_hash.refresh_from_db()
        claimant_old_key_with_hash.refresh_from_db()
        claimant_new_key_null_hash.refresh_from_db()
        claimant_new_key_with_hash.refresh_from_db()
        self.assertEqual(
            claimant_old_key_null_hash.encryption_key_hash, ckr.new_key_hash
        )
        self.assertEqual(
            claimant_old_key_with_hash.encryption_key_hash, ckr.new_key_hash
        )
        self.assertEqual(
            claimant_new_key_null_hash.encryption_key_hash, ckr.new_key_hash
        )
        self.assertEqual(
            claimant_new_key_with_hash.encryption_key_hash, ckr.new_key_hash
        )

    def test_rotate_s3_error_file(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant = self.create_claim_with_key(old_key)
        claimant.encryption_key_hash = encryption_key_hash(old_key)
        claimant.save()
        self.create_claimant_file(claimant, old_key)

        with patch("core.claim_storage.ClaimWriter") as mock_writer:
            mock_writer.return_value.write.return_value = False
            with self.assertRaises(ClaimStorageError) as context:
                ckr = ClaimantKeyRotator(old_key, new_key)
                ckr.rotate()
            # files are attempted first so will trigger error first
            self.assertIn(
                "Failed to write re-encrypted claimant file", str(context.exception)
            )

    def test_rotate_s3_error_claim(self):
        old_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())

        claimant = self.create_claim_with_key(old_key)
        claimant.encryption_key_hash = encryption_key_hash(old_key)
        claimant.save()

        with patch("core.claim_storage.ClaimWriter") as mock_writer:
            mock_writer.return_value.write.return_value = False
            with self.assertRaises(ClaimStorageError) as context:
                ckr = ClaimantKeyRotator(old_key, new_key)
                ckr.rotate()
            # no file exists so we trigger the partial claim error
            self.assertIn(
                "Failed to write re-encrypted partial claim", str(context.exception)
            )
