# -*- coding: utf-8 -*-
from jsonschema.validators import validator_for
from jsonschema import FormatChecker
from django.conf import settings
import jsonref

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
        return jsonref.loads(json_str)

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
        return self._clean_schema(schema)

    def validate_against_whoami(self, whoami):
        # TODO populate self.errors
        if "email" not in self.claim:
            return False
        if self.claim["email"] != whoami.email:
            return False
        return True

    def _clean_schema(self, schema):
        props_to_remove = []
        if "properties" not in schema:  # pragma: no-cover
            raise Exception("No properties in schema: {}".format(schema))

        for prop_name, prop in schema["properties"].items():
            if prop_name.startswith("LOCAL_"):
                props_to_remove.append(prop_name)
                continue  # do we do not check required_for_swa

            if "$schema" in prop and prop["type"] == "object":
                # subschema. recurse.
                prop = self._clean_schema(prop)

            if (
                prop["type"] == "array"
                and "$schema" in prop["items"]
                and prop["items"]["type"] == "object"
            ):
                # subschema. recurse.
                prop["items"] = self._clean_schema(prop["items"])

            if "required_for_swa" in prop and prop["required_for_swa"]:
                schema["required"].append(prop_name)

            if "required_for_complete" in prop and prop["required_for_complete"]:
                schema["required"].append(prop_name)

        # no LOCAL_ in required. De-dupe while we're at it.
        if "required" in schema:
            schema["required"] = list(
                filter(lambda k: not k.startswith("LOCAL_"), set(schema["required"]))
            )

        for prop_name in props_to_remove:
            del schema["properties"][prop_name]

        return schema
