# -*- coding: utf-8 -*-
from django.test import TestCase
from django.utils import timezone
from django.conf import settings

from api.test_utils import create_whoami, BaseClaim
from api.whoami import WhoAmI
from api.claim_validator import ClaimValidator

import logging
from os import listdir
from os.path import isfile, join, isdir
from jwcrypto.common import json_decode


logger = logging.getLogger(__name__)


class ClaimValidatorTestCase(TestCase, BaseClaim):
    def test_example_claim_instance(self):
        example = settings.BASE_DIR / "schemas" / "claim-v1.0-example.json"
        with open(example) as f:
            json_str = f.read()
        example_claim = json_decode(json_str)
        cv = ClaimValidator(example_claim, base_url="http://example.com")
        logger.debug("🚀 claim errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)
        self.assertEquals(cv.schema_url, "http://example.com/schemas/claim-v1.0.json")

    def test_example_identity_instances(self):
        for ial in [1, 2]:
            example = (
                settings.BASE_DIR / "schemas" / f"identity-v1.0-example-ial{ial}.json"
            )
            with open(example) as f:
                json_str = f.read()
            cv = ClaimValidator(json_decode(json_str), schema_name="identity-v1.0")
            logger.debug("🚀 IAL{} identity errors={}".format(ial, cv.errors_as_dict()))
            self.assertTrue(cv.valid)

    def test_whoami_mismatch(self):
        whoami = WhoAmI.from_dict(create_whoami())
        example = settings.BASE_DIR / "schemas" / "claim-v1.0-example.json"
        with open(example) as f:
            json_str = f.read()

        example_claim = json_decode(json_str)
        del example_claim["email"]
        cv = ClaimValidator(example_claim, base_url="http://example.com")
        self.assertFalse(cv.validate_against_whoami(whoami))

        example_claim["email"] = "someone-else@example.com"
        cv = ClaimValidator(example_claim, base_url="http://example.com")
        self.assertFalse(cv.validate_against_whoami(whoami))

        example_claim["email"] = whoami.email
        cv = ClaimValidator(example_claim, base_url="http://example.com")
        self.assertTrue(cv.validate_against_whoami(whoami))

    def test_claim_permutations(self):
        dirlist = settings.FIXTURE_DIR
        fixtures = [f for f in listdir(dirlist) if isdir(join(dirlist, f))]
        for fixture in fixtures:
            for validity in ["valid", "invalid"]:
                fixture_dir = dirlist / fixture / validity
                cases = [
                    f for f in listdir(fixture_dir) if isfile(join(fixture_dir, f))
                ]
                for case in cases:
                    logger.debug(f"Checking fixture {fixture} / {validity} / {case}")
                    claim = self.base_claim()
                    with open(fixture_dir / case) as f:
                        json = json_decode(f.read())
                    for key in json:
                        if json[key] is None and key in claim:
                            claim.pop(key)
                        else:
                            claim[key] = json[key]
                    cv = ClaimValidator(claim)
                    if validity == "valid" and not cv.valid:  # pragma: no cover
                        logger.debug(
                            "🚀 A valid permutation resulted in errors={}".format(
                                cv.errors_as_dict()
                            )
                        )
                    self.assertEqual(
                        cv.valid,
                        validity == "valid",
                        f"{fixture} / {validity} / {case}",
                    )

    def test_claim_validator(self):
        claim = self.base_claim()
        cv = ClaimValidator(claim)
        logger.debug("🚀 claim errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234", "email": "foo"}
        cv = ClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertEqual(len(cv.errors), 27, error_dict)
        self.assertIn("'1234' is not a 'date'", error_dict)
        self.assertIn("'foo' is not a 'email'", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)

        invalid_ssn = {"ssn": "1234"}
        cv = ClaimValidator(invalid_ssn)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn(
            "'1234' does not match",
            list(filter(lambda e: "does not match" in e, error_dict.keys()))[0],
        )

        claim = self.base_claim() | {"random_field": "value"}
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn(
            "Additional properties are not allowed ('random_field' was unexpected)",
            error_dict,
        )

    def test_swa_required_fields(self):
        claim = self.base_claim() | {
            "worked_in_other_states": ["CA", "WV"],
        }
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "worked_in_other_states": ["CA", "WV", "XX"],
        }
        del claim["claimant_name"]
        cv = ClaimValidator(claim)
        error_dict = cv.errors_as_dict()
        self.assertFalse(cv.valid)
        self.assertIn("'claimant_name' is a required property", error_dict)
        self.assertIn(
            "'XX' is not one of",
            list(filter(lambda e: "XX" in e, error_dict.keys()))[0],
        )

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "permanent_resident",
                "alien_registration_number": "111-111-111",
                "authorized_to_work": True,
            }
        }
        cv = ClaimValidator(claim)
        logger.debug("errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "alien_registration_number": "111-111-111",
                "authorized_to_work": True,
            }
        }
        # schema is valid but non-sensical
        cv = ClaimValidator(claim)
        logger.debug("errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "authorized_to_work": False,
            }
        }
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        logger.debug("errors={}".format(error_dict))
        self.assertIn(
            "'not_authorized_to_work_explanation' is a required property",
            list(error_dict.keys()),
        )

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "authorized_to_work": False,
                "not_authorized_to_work_explanation": "something is wrong",
            }
        }
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        # union membership
        union_claim = self.base_claim() | {"union": {"is_union_member": False}}
        cv = ClaimValidator(union_claim)
        error_dict = cv.errors_as_dict()
        logger.debug("🚀 errors={}".format(error_dict))
        self.assertTrue(cv.valid)
        union_claim = self.base_claim() | {"union": {"is_union_member": True}}
        cv = ClaimValidator(union_claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        logger.debug("🚀 errors={}".format(error_dict))
        self.assertIn(
            "'union_name' is a required property",
            list(error_dict.keys()),
        )
        union_claim = self.base_claim() | {
            "union": {
                "is_union_member": True,
                "union_name": "foo",
                "union_local_number": "1234",
                "required_to_seek_work_through_hiring_hall": False,
            }
        }
        cv = ClaimValidator(union_claim)
        self.assertTrue(cv.valid)

    def test_completed_claim_validator(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        cv = ClaimValidator(claim)
        logger.debug("🚀 LOCAL_")
        logger.debug(cv.errors_as_dict())
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234"}
        cv = ClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertEqual(len(cv.errors), 27, error_dict)
        logger.debug("errors: {}".format(error_dict))
        self.assertIn("'1234' is not a 'date'", error_dict)
        self.assertIn("'ssn' is a required property", error_dict)
        self.assertIn("'email' is a required property", error_dict)
        self.assertIn("'residence_address' is a required property", error_dict)
        self.assertIn("'mailing_address' is a required property", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)
        self.assertIn("'payment' is a required property", error_dict)

    def test_employer_conditionals(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        del claim["employers"][0]["last_work_date"]
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("'last_work_date' is a required property", error_dict)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["separation_reason"] = "still_employed"
        del claim["employers"][0]["last_work_date"]
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        del claim["employers"][0]["separation_option"]
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("'separation_option' is a required property", error_dict)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["separation_reason"] = "retired"
        del claim["employers"][0]["separation_option"]
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

    def test_local_validation_rules(self):
        # first work date later than last work date
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["first_work_date"] = "2022-02-01"
        claim["employers"][0]["last_work_date"] = "2022-01-01"
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("first_work_date is later than last_work_date", error_dict)

    def test_nested_conditional_validation(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        # Delete attribute required by nested conditional
        del claim["disability"]["contacted_last_employer_after_recovery"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertFalse(cv.valid)

        # Delete attribute requiring previously-deleted conditional
        del claim["disability"]["recovery_date"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertTrue(cv.valid)

        del claim["payment"]["account_type"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertFalse(cv.valid)
