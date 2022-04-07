# -*- coding: utf-8 -*-
from django.test import TestCase
from api.test_utils import create_whoami, BaseClaim
from api.whoami import WhoAmI
from api.claim_cleaner import ClaimCleaner
import logging


logger = logging.getLogger(__name__)


class ClaimCleanerTestCase(TestCase, BaseClaim):
    def test_claim_cleaner(self):
        payload = self.base_claim() | {
            "claimant_id": "xyz",
            "swa_code": "XX",
            "ssn": "666000000",
            "email": "fake@example.com",
            "birthdate": "1999-12-12",
            "work_authorization": {
                "authorization_type": "permanent_resident",
                "alien_registration_number": "111111111",
                "authorized_to_work": True,
            },
        }
        whoami = WhoAmI.from_dict(create_whoami())
        claim_cleaner = ClaimCleaner(payload, whoami)
        cleaned_claim = claim_cleaner.cleaned()
        logger.debug("🚀 cleaned_claim={}".format(cleaned_claim))
        self.assertEqual(cleaned_claim["ssn"], "666-00-0000")
        self.assertEqual(cleaned_claim["email"], "fake@example.com")
        self.assertEqual(cleaned_claim["birthdate"], "1999-12-12")
        self.assertEqual(cleaned_claim["employers"][0]["fein"], "00-1234567")
        self.assertEqual(
            cleaned_claim["work_authorization"]["alien_registration_number"],
            "111-111-111",
        )
