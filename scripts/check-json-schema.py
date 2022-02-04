#!/usr/bin/env python
# -*- coding: utf-8 -*-

# usage: python scripts/check-json-schema.py schemas/claim-v1.0.json schemas/claim-v1.0-example.json

import json
import sys
import os
import pprint
import jsonref
from jsonschema.validators import validator_for
from jsonschema import FormatChecker

if len(sys.argv) < 2:
    print(f"usage: {sys.argv[0]} path/to/schema.json path/to/instance.json")
    exit(1)

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

if os.environ.get("DEBUG"):
    pprint.pprint(schema)

if len(errors) == 0:
    print("{} ok".format(instance_file))
else:
    pprint.pprint(errors)
