# -*- coding: utf-8 -*-
from django.test import TestCase
from django.db.models import ProtectedError
from api.models import Claimant
from api.test_utils import create_idp, create_claimant
import logging

logger = logging.getLogger(__name__)


class ClaimantTestCase(TestCase):
    def test_claimant(self):
        idp = create_idp()

        claimant = create_claimant(idp)

        # claimant will not be deleted if the idp is deleted
        with self.assertRaises(ProtectedError):
            idp.delete()

        claimant_copy = Claimant.objects.get(id=claimant.id)
        self.assertEqual(claimant_copy.idp, idp)

    def test_claimant_IAL(self):
        idp = create_idp()
        claimant = create_claimant(idp)

        self.assertFalse(claimant.bump_IAL_if_necessary("3"))
        self.assertFalse(claimant.bump_IAL_if_necessary("1"))
        self.assertTrue(
            claimant.bump_IAL_if_necessary("2")
        )  # only the first results in a change
        self.assertFalse(claimant.bump_IAL_if_necessary("2"))
