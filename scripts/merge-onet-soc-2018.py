#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# merge the SOC 2018 data with O*NET

import sys
import json

if len(sys.argv) < 3:
    print(
        "usage: {} path/to/onet.json path/to/parse-soc-webpage-output.json".format(
            sys.argv[0]
        )
    )
    exit(1)

with open(sys.argv[1], "r") as fh:
    onet = json.load(fh)
with open(sys.argv[2], "r") as fh:
    soc = json.load(fh)

for code in onet.keys():
    entry = onet[code]
    if code.endswith(".00"):  # code == entry["soc"]
        soc[code] = soc[entry["soc"]]
        soc[code]["c"] = code
        del soc[entry["soc"]]
    else:
        soc[code] = {
            "c": code,
            "d": entry["description"],
            "t": entry["title"],
            "e": None,
        }

print(json.dumps(soc))
