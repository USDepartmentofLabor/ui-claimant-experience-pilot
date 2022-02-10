# -*- coding: utf-8 -*-
from django.test import TestCase
from .claimant_key_rotator import ClaimantKeyRotator
from core.claim_encryption import (
    symmetric_encryption_key,
    encryption_key_hash,
    SymmetricClaimEncryptor,
)
from core.claim_storage import ClaimWriter
from core.test_utils import (
    create_s3_bucket,
    delete_s3_bucket,
    generate_symmetric_encryption_key,
)
from api.test_utils import create_idp, create_swa
from api.models import Claim, Claimant, ClaimantFile
import uuid


class ClaimantKeyRotatorTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def setUp(self):
        super().setUp()
        self.idp = create_idp()
        self.swa, _ = create_swa()

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
