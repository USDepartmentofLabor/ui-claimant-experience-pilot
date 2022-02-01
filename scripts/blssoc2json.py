#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Turns the BLS SOC .xlsx file into JSON tree.
# e.g. https://www.bls.gov/soc/2018/soc_structure_2018.xlsx
# Requires you convert the .xlsx into .csv format with something
# like https://github.com/dilshod/xlsx2csv

# usage:
# python scripts/blssoc2json.py soc_structure_2018.csv > claimant/src/fixtures/soc_structure_2018.json

import csv
import sys
import json

if len(sys.argv) < 2:
    print("{} path/to/file.csv".format(sys.argv[0]))
    exit(1)

csv_file = sys.argv[1]

bls_soc = {}
major = ""
minor = ""
broad = ""
detailed = ""
# the .xlsx has some manual header info we want to skip till we hit the "real" header line
# real header: Major Group,Minor Group,Broad Group,Detailed Occupation,
data_started = False
with open(csv_file) as csvfile:
    reader = csv.reader(csvfile)
    for row in reader:
        if not row:
            continue
        if row[0] == "Major Group":
            data_started = True
            continue
        if not data_started:
            continue

        label = row[4]

        if len(row[0]):  # new major section
            major = row[0]
            bls_soc[major] = {"_label": label}
            continue
        if len(row[1]):  # new minor section
            minor = row[1]
            bls_soc[major][minor] = {"_label": label}
            continue
        if len(row[2]):  # new broad section
            broad = row[2]
            bls_soc[major][minor][broad] = {"_label": label}
            continue
        if len(row[3]):  # new detailed
            detailed = row[3]
            bls_soc[major][minor][broad][detailed] = {"_label": label}
            continue

print(json.dumps(bls_soc))
