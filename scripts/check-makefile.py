#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import re
from typing import Optional
from typing import Sequence


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("filenames", nargs="*", help="Filenames to check")
    parser.add_argument(
        "--exclude-target",
        dest="exclude_targets",
        action="append",
        default=["default"],
    )
    args = parser.parse_args(argv)

    results = []

    for filename in args.filenames:
        with open(filename) as f:
            lines = f.readlines()

        for line in lines:
            text = line.rstrip()
            if re.match(r"[\w\-]+:", text) and not re.search("##", text):
                target_name, remainder = re.split(":", text)
                if target_name not in args.exclude_targets:
                    results.append(f"{filename}: {target_name}")

    if len(results) > 0:
        print("Makefile targets missing help text:\n")
        for result in results:
            print(result)
        return 1
    else:
        return 0


if __name__ == "__main__":
    exit(main())
