# -*- coding: utf-8 -*-
from django.test import TestCase
from api.test_utils import create_idp
import logging

logger = logging.getLogger(__name__)


class IdentityProviderTestCase(TestCase):
    def test_identity_provider(self):
        idp = create_idp()
        self.assertEqual(idp.name, "my identity provider")
