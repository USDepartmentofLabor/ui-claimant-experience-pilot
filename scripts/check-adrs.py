#!/usr/bin/env python3
# -*- coding: utf-8 -*-

# Check that ADRs:
# * do not repeat numbers

import pathlib
import re


def main() -> int:

    root_path = pathlib.Path("docs/adr")

    results = []

    adr_numbers = {}

    for filename in list(map(str, root_path.glob("*.md"))):
        matches = re.search(r"(\d+)-", filename)
        if not matches:
            continue
        number = matches.group(1)
        if number in adr_numbers:
            results.append("{} appears more than once in ADR names".format(number))
        else:
            adr_numbers[number] = filename

    if len(results) > 0:
        print("ADR errors:\n")
        for result in results:
            print(result)
        return 1
    else:
        return 0


if __name__ == "__main__":
    exit(main())
