# -*- coding: utf-8 -*-
from django.test import TransactionTestCase, TestCase
from django.db import IntegrityError
from api.models import SWA, IdentityProvider
import datetime
from api.test_utils import create_swa
import logging

logger = logging.getLogger(__name__)


class SWATestCase(TestCase):
    def test_swa_manager(self):
        ks_swa, _ = create_swa()
        swas = SWA.active.all()
        for swa in swas:
            logger.debug("🚀 SWA: {} {}".format(swa.code, swa.get_status_display()))
        # 2 default + filters out ks_swa because not active
        self.assertEqual(len(swas), 2)

        ks_swa.status = SWA.StatusOptions.ACTIVE
        ks_swa.save()
        another_swa = SWA(code="AA", name="Alpha", status=SWA.StatusOptions.ACTIVE)
        another_swa.save()
        swas = SWA.active.order_by("name").all()
        self.assertEqual(
            list(map(lambda swa: swa.code, swas)), ["AA", "AR", "KS", "NJ"]
        )


class SWATransactionTestCase(TransactionTestCase):
    def test_swa(self):
        keyless_swa = SWA(code="NO", name="NO", claimant_url="no")
        keyless_swa.save()
        with self.assertRaises(ValueError) as context:
            keyless_swa.public_key_as_jwk()

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
