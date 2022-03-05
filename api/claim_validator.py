# -*- coding: utf-8 -*-
from jsonschema.validators import validator_for
from jsonschema.exceptions import ValidationError
from jsonschema import FormatChecker
from django.conf import settings
import jsonref
from datetime import datetime

CLAIM_V1 = "claim-v1.0"
DEFAULT_SCHEMA = CLAIM_V1


class ClaimValidator(object):
    def __init__(
        self,
        claim_payload,
        schema_name=DEFAULT_SCHEMA,
        base_url="https://unemployment.dol.gov",
    ):
        self.schema = self.read_schema(schema_name)
        self.schema_url = f"{base_url}/schemas/{schema_name}.json"
        self.claim = claim_payload
        self.valid = self.validate()

    def read_schema(self, schema_name):
        schema_path = settings.BASE_DIR / "schemas" / f"{schema_name}.json"
        with open(schema_path) as f:
            json_str = f.read()
        return jsonref.loads(json_str)

    def validate(self):
        self.validator = validator_for(self.schema)(
            self.schema, format_checker=FormatChecker()
        )
        self.errors = []
        for err in self.validator.iter_errors(instance=self.claim):
            self.errors.append(err)
        self._apply_local_validations()
        return len(self.errors) == 0

    # things that JSON schema cannot enforce
    def _apply_local_validations(self):
        if "employers" in self.claim:
            for idx, employer in enumerate(self.claim["employers"]):
                # if last_work_date exists, verify first_work_date is earlier
                if "last_work_date" in employer:
                    last_date = datetime.fromisoformat(employer["last_work_date"])
                    first_date = datetime.fromisoformat(employer["first_work_date"])
                    if first_date > last_date:
                        err = ValidationError(
                            message="first_work_date is later than last_work_date",
                            path=[f"employers[{idx}]", "first_work_date"],
                            validator_value=None,
                        )
                        self.errors.append(err)
        if "other_pay" in self.claim:
            for idx, other_pay in enumerate(self.claim["other_pay"]):
                # date_received must be a valid date
                if "date_received" in other_pay:
                    try:
                        datetime.fromisoformat(other_pay["date_received"])
                    except ValueError:
                        err = ValidationError(
                            message="date_received is not a valid date",
                            path=[f"other_pay[{idx}]", "date_received"],
                            validator_value=None,
                        )
                        self.errors.append(err)

    def errors_as_dict(self):
        errors = {}
        for err in self.errors:
            errors[err.message] = {
                "path": err.json_path,
                "invalid": err.validator_value,
                "message": err.message,
                "context": str(err.context),
                "cause": str(err.cause),
            }

        return errors

    def validate_against_whoami(self, whoami):
        # TODO populate self.errors
        if "email" not in self.claim:
            return False
        if self.claim["email"] != whoami.email:
            return False
        return True
