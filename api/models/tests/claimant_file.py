# -*- coding: utf-8 -*-
from api.test_utils import create_swa, create_idp, create_claimant
import logging
from core.test_utils import BucketableTestCase, generate_symmetric_encryption_key
from api.test_utils import create_claimant_file
from core.claim_encryption import symmetric_encryption_key
from jwcrypto.common import json_decode

logger = logging.getLogger(__name__)


class ClaimantFileTestCase(BucketableTestCase):
    def test_claimant_file(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        sym_key = symmetric_encryption_key(generate_symmetric_encryption_key())
        claimant_file = create_claimant_file(claimant, swa, sym_key)
        self.assertEqual(claimant_file.claimant, claimant)
        encrypted_package = json_decode(claimant_file.get_encrypted_package())
        logger.debug("🚀 encrypted_package={}".format(encrypted_package))
        self.assertEqual(encrypted_package["claim_id"], str(claimant_file.uuid))
