# -*- coding: utf-8 -*-
from django.test import TestCase
from api.models import Claimant, Claim
import datetime
from datetime import timedelta
from django.utils import timezone
from api.test_utils import create_swa, create_idp, create_claimant
import logging

logger = logging.getLogger(__name__)


class EventTestCase(TestCase):
    def test_events(self):
        idp = create_idp()
        claimant = create_claimant(idp)
        ks_swa, _ = create_swa()
        claim = Claim(swa=ks_swa, claimant=claimant)
        claim.save()

        event_time = timezone.now()
        claim_event = claim.events.create(
            category=Claim.EventCategories.STORED, happened_at=event_time
        )
        self.assertIsInstance(claim_event.happened_at, datetime.datetime)
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STORED).all()[0],
            claim_event,
        )
        self.assertEqual(claim_event.get_category_display(), "Stored")
        self.assertEqual(
            claim_event.as_public_dict(),
            {
                "happened_at": str(event_time),
                "category": "Stored",
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
