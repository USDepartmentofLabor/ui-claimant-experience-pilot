#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# take the output of the blssoc2json.py script
# which is a JSON hierarchy
# and merge it with the output of parse-soc-2018-webpage.py
# which is an array of details

import sys
import json

if len(sys.argv) < 3:
    print(
        "usage: {} path/to/blssoc2json-output.json path/to/parse-soc-webpage-output.json".format(
            sys.argv[0]
        )
    )
    exit(1)

with open(sys.argv[1], "r") as fh:
    tree = json.load(fh)
with open(sys.argv[2], "r") as fh:
    detail_entries = json.load(fh)

for major_id, minors in tree.items():
    for minor_id, broads in minors.items():
        if minor_id == "_label":
            continue
        for broad_id, details in broads.items():
            if broad_id == "_label":
                continue
            for detail_id, detail in details.items():
                if detail_id == "_label":
                    continue
                # print(detail)
                if detail_id not in detail_entries:
                    print("missing entry: {}".format(detail_id), file=sys.stderr)
                    continue

                entry = detail_entries[detail_id]
                # short key names to save space
                detail["desc"] = entry["d"]
                detail["ex"] = entry["e"]
                # rename for consistency
                detail["title"] = detail["_label"]
                del detail["_label"]

print(json.dumps(tree))
