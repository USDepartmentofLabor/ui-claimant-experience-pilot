# -*- coding: utf-8 -*-
from django.test import TestCase
from api.test_utils import create_whoami
from api.whoami import WhoAmI
import logging


logger = logging.getLogger(__name__)


class WhoAmITestCase(TestCase):
    def test_whoami_address(self):
        attrs = create_whoami()
        whoami = WhoAmI.from_dict(attrs)
        self.assertEqual(whoami.address.state, "KS")

    def test_whoami_optional_attributes(self):
        whoami = WhoAmI.from_dict({"email": "foo@example.com", "claimant_id": None})
        self.assertEqual(whoami.claimant_id, None)

    def test_whoami_as_identity(self):
        whoami = WhoAmI.from_dict(create_whoami() | {"verified_at": "1234567890"})
        self.assertEqual(
            whoami.as_identity()["verified_at"], "2009-02-13T23:31:30+00:00"
        )
