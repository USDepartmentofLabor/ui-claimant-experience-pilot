# -*- coding: utf-8 -*-
from django.test import TestCase
import logging
from unittest.mock import patch

logger = logging.getLogger(__name__)


class LaunchDarklyTestCase(TestCase):
    def test_client_key_populated(self):
        response = self.client.get("/claimant/")
        self.assertRegex(
            response.content.decode("UTF-8"), r'window\.LD_CLIENT_SDK_KEY=".{24}"'
        )

    @patch("core.middleware.maintenance_mode.ld_client")
    def test_maintenance_mode(self, patched_ld_client_core):
        patched_ld_client_core.variation.return_value = True
        response = self.client.get("/about/")
        self.assertContains(response, "down for maintenance")
