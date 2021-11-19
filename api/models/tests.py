# -*- coding: utf-8 -*-
from django.test import TransactionTestCase, TestCase
from django.db import IntegrityError
from django.db.models import ProtectedError
from api.models import SWA, IdentityProvider, Claimant, Claim
import datetime
from datetime import timedelta
from django.utils import timezone
from api.test_utils import create_swa, create_idp, create_claimant
import logging


logger = logging.getLogger(__name__)


class ApiModelsManagerTestCase(TestCase):
    def test_swa_manager(self):
        ks_swa, _ = create_swa()
        swas = SWA.active.all()
        for swa in swas:
            logger.debug("SWA: {} {}".format(swa.code, swa.get_status_display()))
        # 2 default + filters out ks_swa becase not active
        self.assertEqual(len(swas), 2)

        ks_swa.status = SWA.StatusOptions.ACTIVE
        ks_swa.save()
        another_swa = SWA(code="AA", name="Alpha", status=SWA.StatusOptions.ACTIVE)
        another_swa.save()
        swas = SWA.active.order_by("name").all()
        self.assertEqual(swas[0].code, "AA")  # sorts first
        self.assertEqual(swas[2].code, "KS")  # included now that it is active


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

    def test_swa_claim_queue(self):
        swa, _ = create_swa()
        idp = create_idp()
        claimant = create_claimant(idp)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()

        self.assertEqual(swa.claim_queue().count(), 0)

        claim.events.create(category=Claim.EventCategories.COMPLETED)
        self.assertEqual(swa.claim_queue().count(), 1)

        claim.events.create(category=Claim.EventCategories.FETCHED)
        self.assertEqual(swa.claim_queue().count(), 0)

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
        claim = Claim(
            uuid=claim_uuid, swa=ks_swa, claimant=claimant, status="something"
        )
        claim.save()
        event_time = timezone.now()

        claim.events.create(
            category=Claim.EventCategories.STARTED,
            happened_at=event_time,
            description="wassup",
        )
        claim.events.create(
            category=Claim.EventCategories.SUBMITTED,
            happened_at=event_time + timedelta(hours=1),
            description="right",
        )

        with self.assertRaises(ProtectedError):
            # swa cannot be deleted if it has a claim
            ks_swa.delete()

        with self.assertRaises(ProtectedError):
            # claimant cannot be deleted if it has a claim
            claimant.delete()

        stored_claim = Claim.objects.get(uuid=claim_uuid)
        self.assertEqual(stored_claim.swa, ks_swa)
        self.assertEqual(stored_claim.claimant, claimant)
        self.assertEqual(stored_claim.status, "something")

        self.assertEqual(
            stored_claim.public_events(),
            [
                {
                    "category": "Started",
                    "happened_at": str(event_time),
                    "description": "wassup",
                },
                {
                    "category": "Submitted",
                    "happened_at": str(event_time + timedelta(hours=1)),
                    "description": "right",
                },
            ],
        )

    def test_events(self):
        idp = create_idp()
        claimant = create_claimant(idp)
        ks_swa, _ = create_swa()
        claim = Claim(swa=ks_swa, claimant=claimant)
        claim.save()

        event_time = timezone.now()
        claim_event = claim.events.create(
            category=Claim.EventCategories.STARTED, happened_at=event_time
        )
        self.assertIsInstance(claim_event.happened_at, datetime.datetime)
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STARTED).all()[0],
            claim_event,
        )
        self.assertEqual(claim_event.get_category_display(), "Started")
        self.assertEqual(
            claim_event.as_public_dict(),
            {
                "happened_at": str(event_time),
                "category": "Started",
                "description": "",
            },
        )

        yesterday = timezone.now() - timedelta(days=1)
        claimant_event = claimant.events.create(
            category=Claimant.EventCategories.LOGGED_IN, happened_at=yesterday
        )
        self.assertEqual(
            claimant.events.filter(category=Claimant.EventCategories.LOGGED_IN).all()[
                0
            ],
            claimant_event,
        )
        self.assertEqual(claimant_event.get_category_display(), "Logged In")
        self.assertEqual(claimant_event.happened_at, yesterday)

        # our enum is not enforced, so exercise the error case
        unknown_event = claim.events.create(category=0)
        self.assertEqual(unknown_event.get_category_display(), "Unknown")
