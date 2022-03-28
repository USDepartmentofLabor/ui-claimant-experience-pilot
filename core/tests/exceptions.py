# -*- coding: utf-8 -*-
from django.test import TestCase
from core.exceptions import SwaXidError
from api.test_utils import create_swa
import logging


logger = logging.getLogger(__name__)


class CoreExceptionsTestCase(TestCase):
    def test_swa_xid_error(self):
        swa, _ = create_swa()
        err = SwaXidError(swa, "oops!")
        self.assertEqual(err.swa, swa)
