# -*- coding: utf-8 -*-
from api.test_utils import (
    create_idp,
    create_swa,
    create_claimant,
    create_whoami,
    TEST_SWA,
)
from api.models import Claim, SWA
from api.whoami import WhoAmI
from core.test_utils import BucketableTestCase
from core.claim_encryption import AsymmetricClaimDecryptor
from core.claim_storage import ClaimReader

from api.identity_claim_maker import IdentityClaimMaker

import logging


logger = logging.getLogger(__name__)


class IdentityClaimMakerTestCase(BucketableTestCase):
    def setUp(self):
        super().setUp()
        swa, private_key_jwk = create_swa(
            is_active=True,
            code=TEST_SWA["code"],
            name=TEST_SWA["name"],
            claimant_url=TEST_SWA["claimant_url"],
            featureset=SWA.FeatureSetOptions.IDENTITY_ONLY,
        )
        self.swa = swa
        self.swa_private_key = private_key_jwk

    def test_identity_claim(self):
        idp = create_idp()
        claimant = create_claimant(idp)
        claim = Claim(swa_xid="abc-123", swa=self.swa, claimant=claimant)
        claim.save()
        whoami = WhoAmI.from_dict(create_whoami() | {"swa": self.swa.for_whoami()})
        claim_maker = IdentityClaimMaker(claim, whoami)
        self.assertTrue(claim_maker.create())

        # fetch the encrypted claim from the S3 bucket directly and decrypt it.
        self.assertTrue(claim.is_completed())
        claim_id = str(claim.uuid)
        cr = ClaimReader(claim)
        packaged_claim_str = cr.read()
        acd = AsymmetricClaimDecryptor(packaged_claim_str, self.swa_private_key)
        decrypted_claim = acd.decrypt()
        self.assertEqual(acd.packaged_claim["claim_id"], claim_id)
        self.assertEqual(decrypted_claim["id"], claim_id)
        self.assertEqual(decrypted_claim["claimant_id"], claimant.idp_user_xid)
        self.assertEqual(
            decrypted_claim["$schema"],
            "https://unemployment.dol.gov/schemas/identity-v1.0.json",
        )
