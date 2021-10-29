# -*- coding: utf-8 -*-
from django.test import TransactionTestCase
from django.db import IntegrityError
from django.db.models import ProtectedError
from api.models import SWA, IdentityProvider, Claimant, Claim
import datetime
from api.test_utils import create_swa, create_idp, create_claimant


class ApiModelsTestCase(TransactionTestCase):
    def test_swa(self):
        ks_swa, private_key_jwk = create_swa()

        self.assertTrue(ks_swa.created_at)
        self.assertTrue(ks_swa.updated_at)
        self.assertIsInstance(ks_swa.created_at, datetime.datetime)
        self.assertIsInstance(ks_swa.updated_at, datetime.datetime)

        # cannot create another KS row
        with self.assertRaises(IntegrityError) as context:
            SWA(code="KS", name="Duplicate KS").save()
        self.assertIn("Duplicate entry", str(context.exception))

        # public key round-trip works
        self.assertEqual(
            ks_swa.public_key_as_jwk().thumbprint(), ks_swa.public_key_fingerprint
        )

        # FK constraint works
        foobar_idp = IdentityProvider(name="foobar")
        foobar_idp.save()
        ks_swa.idp = foobar_idp
        ks_swa.save()
        self.assertEqual(foobar_idp.id, ks_swa.idp_id)

        foobar_idp.delete()
        ks_swa.refresh_from_db()
        self.assertEqual(ks_swa.idp, None)

        # status enum works
        self.assertEqual(ks_swa.get_status_display(), "Inactive")
        self.assertEqual(ks_swa.status, SWA.StatusOptions.INACTIVE)
        # NOTE there is no constraint with enum -- possible to set a value not in our options list
        ks_swa.status = 2
        ks_swa.save()
        self.assertEqual(ks_swa.get_status_display(), 2)

    def test_claimant(self):
        idp = create_idp()

        claimant = create_claimant(idp)

        # claimant will not be deleted if the idp is deleted
        with self.assertRaises(ProtectedError):
            idp.delete()

        claimant_copy = Claimant.objects.get(id=claimant.id)
        self.assertEqual(claimant_copy.idp, idp)

    def test_claim(self):
        ks_swa, _ = create_swa()
        idp = create_idp()
        claimant = create_claimant(idp)
        claim_uuid = "055594e0-3488-4b9d-942c-5203e7c1929f"
        claim = Claim(uuid=claim_uuid, swa=ks_swa, claimant=claimant)
        claim.save()

        with self.assertRaises(ProtectedError):
            # swa cannot be deleted if it has a claim
            ks_swa.delete()

        with self.assertRaises(ProtectedError):
            # claimant cannot be deleted if it has a claim
            claimant.delete()

        stored_claim = Claim.objects.get(uuid=claim_uuid)
        self.assertEqual(stored_claim.swa, ks_swa)
        self.assertEqual(stored_claim.claimant, claimant)
