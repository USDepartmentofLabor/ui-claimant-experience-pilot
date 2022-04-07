# -*- coding: utf-8 -*-
from django.test import TestCase
from api.test_utils import create_idp, create_swa, create_claimant
from api.models import Claim, Claimant
from api.claim_finder import ClaimFinder
from api.whoami import WhoAmI, WhoAmISWA
import uuid


class ClaimFinderTestCase(TestCase):
    def test_claim_finder(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claimant2 = Claimant(idp_user_xid="otheridp id", idp=idp)
        claimant2.save()
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)

        finder = ClaimFinder(
            WhoAmI.from_dict(
                {
                    "email": "foo@example.com",
                    "claimant_id": claimant.idp_user_xid,
                    "swa": swa.for_whoami(),
                }
            )
        )
        self.assertEqual(claim, finder.find())

        finder = ClaimFinder(WhoAmI(email="foo@example.com", claim_id=claim.uuid))
        self.assertEqual(claim, finder.find())

        # error conditions
        finder = ClaimFinder(WhoAmI(email="foo@example.com"))
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(email="foo@example.com", claimant_id=claimant.idp_user_xid)
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI.from_dict(
                {
                    "email": "foo@example.com",
                    "claimant_id": "nonesuch",
                    "swa": swa.for_whoami(),
                }
            )
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI.from_dict({"email": "foo@example.com", "swa": swa.for_whoami()})
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant.idp_user_xid,
                swa=WhoAmISWA(code="nonesuch", name="nope", featureset="none"),
            )
        )
        self.assertFalse(finder.find())
        self.assertFalse(finder.all())

        finder = ClaimFinder(
            WhoAmI.from_dict(
                {
                    "email": "foo@example.com",
                    "claimant_id": claimant2.idp_user_xid,
                    "swa": swa.for_whoami(),
                }
            )
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(email="foo@example.com", claim_id=str(uuid.uuid4()))
        )
        self.assertFalse(finder.find())

        # multiple completed claims will ignore any resolved even if newer
        claim2 = Claim(claimant=claimant, swa=swa)
        claim2.save()
        claim2.events.create(category=Claim.EventCategories.COMPLETED)
        finder = ClaimFinder(
            WhoAmI.from_dict(
                {
                    "email": "foo@example.com",
                    "claimant_id": claimant.idp_user_xid,
                    "swa": swa.for_whoami(),
                }
            )
        )
        self.assertEqual(claim2, finder.find())
        claim2.events.create(category=Claim.EventCategories.RESOLVED)
        self.assertEqual(claim, finder.find())

        # .all returns everything regardless of events
        finder = ClaimFinder(
            WhoAmI.from_dict(
                {
                    "email": "foo@example.com",
                    "claimant_id": claimant.idp_user_xid,
                    "swa": swa.for_whoami(),
                }
            )
        )
        self.assertEqual(finder.all().count(), 2)
