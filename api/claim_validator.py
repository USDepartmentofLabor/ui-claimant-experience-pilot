# -*- coding: utf-8 -*-
from jsonschema.validators import validator_for
from jsonschema import FormatChecker
from jwcrypto.common import json_decode
from django.conf import settings

CLAIM_V1 = "claim-v1.0"
DEFAULT_SCHEMA = CLAIM_V1


class ClaimValidator(object):
    def __init__(self, claim_payload, schema_name=DEFAULT_SCHEMA):
        self.schema = self.read_schema(schema_name)
        self.schema_url = f"https://ui.dol.gov/schemas/{schema_name}.json"
        self.claim = claim_payload
        self.valid = self.validate()

    def read_schema(self, schema_name):
        schema_path = settings.BASE_DIR / "schemas" / f"{schema_name}.json"
        with open(schema_path) as f:
            json_str = f.read()
        return json_decode(json_str)

    def validate(self):
        self.validator = validator_for(self.schema)(
            self.schema, format_checker=FormatChecker()
        )
        self.errors = []
        for err in self.validator.iter_errors(instance=self.claim):
            self.errors.append(err)
        return len(self.errors) == 0

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


class CompletedClaimValidator(ClaimValidator):
    def read_schema(self, schema_name):
        schema = super().read_schema(schema_name)
        for prop_name, prop in schema["properties"].items():
            if "required_for_swa" in prop and prop["required_for_swa"]:
                schema["required"].append(prop_name)
        return schema
