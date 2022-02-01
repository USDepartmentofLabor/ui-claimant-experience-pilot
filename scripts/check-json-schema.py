#!/usr/bin/env python
# -*- coding: utf-8 -*-

# usage: python scripts/check-json-schema.py schemas/claim-v1.0.json schemas/claim-v1.0-example.json

import json
import sys
import pprint
import jsonref
from jsonschema.validators import validator_for
from jsonschema import FormatChecker

schema_file = sys.argv[1]
instance_file = sys.argv[2]

with open(schema_file) as fh:
    schema = jsonref.load(fh)

with open(instance_file) as fh:
    instance = json.load(fh)

validator = validator_for(schema)(schema, format_checker=FormatChecker())
validator.validate(instance)
errors = []
for err in validator.iter_errors(instance=instance):
    errors.append(err)

pprint.pprint(schema)
pprint.pprint(errors)
