#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import re
from typing import Optional
from typing import Sequence


def check_makefile_line(filename, line, results, exclude_list):
    text = line.rstrip()
    if not re.match(r"[\w\-]+:", text):
        return
    if not re.search("##", text):
        target_name, remainder = re.split(":", text)
        # we have legitimate "double" targets where we set an environment variable for a specific target
        # by "stacking" the targets. See https://www.gnu.org/software/make/manual/html_node/Target_002dspecific.html
        if re.match(r" export \w+", remainder):
            return
        if target_name not in exclude_list:
            results.append(f"{filename}: {target_name}")


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
            check_makefile_line(filename, line, results, args.exclude_targets)

    if len(results) > 0:
        print("Makefile targets missing help text:\n")
        for result in results:
            print(result)
        return 1
    else:
        return 0


if __name__ == "__main__":
    exit(main())
