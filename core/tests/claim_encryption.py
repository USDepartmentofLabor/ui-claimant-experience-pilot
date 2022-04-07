# -*- coding: utf-8 -*-
from django.test import TestCase

from jwcrypto import jwe, jwk
from jwcrypto.common import json_encode, json_decode
from core.claim_encryption import (
    PackagedClaim,
    ALG as EncryptionALG,
    ENC as EncryptionENC,
    AsymmetricClaimEncryptor,
    AsymmetricClaimDecryptor,
    SymmetricClaimEncryptor,
    SymmetricClaimDecryptor,
    RotatableSymmetricClaimDecryptor,
    SymmetricKeyRotator,
    symmetric_encryption_key,
)
from core.test_utils import (
    generate_keypair,
    generate_symmetric_encryption_key,
)
import logging


logger = logging.getLogger(__name__)


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

    def test_symmetric_claim_encryptor(self):
        key = jwk.JWK(generate="oct", size=256)
        claim = {"id": "123-abc", "foo": "something-really-private-and-sensitive"}
        ce = SymmetricClaimEncryptor(claim, key)
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
        cd = SymmetricClaimDecryptor(packaged_claim.as_json(), key)
        decrypted_claim = cd.decrypt()
        self.assertEqual(decrypted_claim, claim)

    def test_symmetric_key_rotation(self):
        old_key = symmetric_encryption_key()
        new_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        rotator = SymmetricKeyRotator(old_key=old_key, new_key=new_key)

        claim = {"id": "123-abc", "foo": "something-really-private-and-sensitive"}

        ce = SymmetricClaimEncryptor(claim, old_key)
        packaged_claim = ce.packaged_claim()
        repackaged_claim = rotator.rotate(packaged_claim)
        self.assertNotEqual(packaged_claim, repackaged_claim)

        cd = SymmetricClaimDecryptor(repackaged_claim.as_json(), new_key)
        decrypted_repackaged_claim = cd.decrypt()
        self.assertEqual(decrypted_repackaged_claim, claim)

    def test_transparent_key_rotation_decryption(self):
        list_of_keys = [
            generate_symmetric_encryption_key(),
            generate_symmetric_encryption_key(),
        ]
        claim = {"id": "123-abc", "foo": "something-really-private-and-sensitive"}
        ce = SymmetricClaimEncryptor(claim, symmetric_encryption_key(list_of_keys[1]))
        packaged_claim = ce.packaged_claim()

        rotable_decryptor = RotatableSymmetricClaimDecryptor(
            packaged_claim.as_json(), list_of_keys
        )
        decrypted_packaged_claim = rotable_decryptor.decrypt()
        self.assertEqual(decrypted_packaged_claim, claim)

        # wrong key should raise error
        with self.assertRaises(ValueError):
            SymmetricClaimDecryptor(
                packaged_claim.as_json(), symmetric_encryption_key(list_of_keys[0])
            )

        with self.assertRaises(ValueError):
            rotable_decryptor = RotatableSymmetricClaimDecryptor(
                packaged_claim.as_json(), [generate_symmetric_encryption_key()]
            )
            rotable_decryptor.decrypt()
