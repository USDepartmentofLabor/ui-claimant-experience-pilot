#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Turns the O*NET-SOC occupations into a JSON structure so we can
# merge with what we get from bls.gov

# usage:
# python scripts/parse-onet-occupations.py onet-occupation.txt > onet-occupation.json

import csv
import sys
import json

if len(sys.argv) < 2:
    print("{} path/to/file.txt".format(sys.argv[0]))
    exit(1)

csv_file = sys.argv[1]

onet = {}
data_started = False
with open(csv_file) as csvfile:
    reader = csv.reader(csvfile, delimiter="\t")
    for row in reader:
        if not row:
            continue
        if row[0] == "O*NET-SOC Code":
            data_started = True
            continue
        if not data_started:
            continue

        code = row[0]
        dot = code.index(".")
        soc = code[0:dot]
        title = row[1]
        description = row[2]
        onet[code] = {"title": title, "description": description, "soc": soc}

print(json.dumps(onet))
