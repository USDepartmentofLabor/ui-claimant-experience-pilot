# -*- coding: utf-8 -*-
from .views import ApiViewsTestCase, ClaimApiTestCase
from .claim_cleaner import ClaimCleanerTestCase
from .claim_validator import ClaimValidatorTestCase
from .claim_finder import ClaimFinderTestCase
from .identity_claim_maker import IdentityClaimMakerTestCase
from .whoami import WhoAmITestCase

__all__ = [
    "ApiViewsTestCase",
    "ClaimApiTestCase",
    "ClaimCleanerTestCase",
    "ClaimValidatorTestCase",
    "ClaimFinderTestCase",
    "IdentityClaimMakerTestCase",
    "WhoAmITestCase",
]
