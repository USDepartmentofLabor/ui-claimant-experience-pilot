# -*- coding: utf-8 -*-
from django.test import TestCase
import logging
from core.swa_xid import SwaXid


logger = logging.getLogger(__name__)


class SwaXidTestCase(TestCase):
    def test_swa_xid_timestamp(self):
        sx = SwaXid("20220222-123456-abc", "AR")
        # converts to UTC
        self.assertEqual(sx.as_isoformat(), "2022-02-22T18:34:56+00:00")
        self.assertTrue(sx.datetime)
        self.assertEqual(f"{sx}", "20220222-123456-abc")
        # however the format is incorrect
        self.assertFalse(sx.format_ok())

    def test_swa_xid_format(self):
        sx = SwaXid("20220222-123456-1234567-123456789", "AR")
        self.assertTrue(sx.format_ok())

    def test_swa_xid_setting_unknown(self):
        sx = SwaXid("abc-123", "XX")
        self.assertTrue(sx.format_ok())
        self.assertFalse(sx.datetime)
        self.assertFalse(sx.as_isoformat())

    def test_swa_xid_invalid_date(self):
        sx = SwaXid("20220222-999999-abc", "AR")
        self.assertFalse(sx.format_ok())
        self.assertFalse(sx.datetime)
