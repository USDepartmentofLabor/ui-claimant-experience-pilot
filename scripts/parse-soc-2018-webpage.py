#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# parse the BLS web page into structured JSON
# ordinarily you'd want to use lxml or beautifulsoup for this task,
# but the HTML is not well-formed, and so we can't easily understand
# all the nested lists.
# however, the detailed entries are obviously generated from a template
# so we use regex to reverse-engineer that template and then
# normalize all the messy whitespace.

import json
import re

# USAGE
# first,
# wget "https://www.bls.gov/soc/2018/major_groups.htm"
# second, run this script

with open("major_groups.htm", "r") as fh:
    html_buf = fh.read()

# strip out header/footer
header_marker = "<!-- [*]+ End HEADER [*]+ -->"
footer_marker = "<!-- [*]+TRAILER FILES[*]+ -->"
pattern = f"{header_marker}.+?</h3>\n(<ul>.+</ul>).+?{footer_marker}"
matches = re.search(pattern, html_buf, re.DOTALL)
body = matches.group(1)

"""
<li>55-3016&nbsp; <a class="question" id="q866" onclick="showAnswer(866); return false;"
            href="/soc/2018/major_groups.htm#">Infantry </a>
            <div class="answer" id="a866">
              <p>Operate weapons and equipment in ground combat operations. Duties
                include operating and maintaining weapons, such as
                rifles, machine            guns, mortars, and hand grenades;
                locating, constructing, and            camouflaging infantry
                positions and equipment; evaluating terrain            and recording
                topographical information; operating and maintaining
                field communications equipment; assessing need for and directing
                supporting fire; placing explosives and performing
                minesweeping            activities on land; and participating in
                basic reconnaissance            operations.</p>
              <p>Illustrative examples: <em>Infantryman , Machine Gunner ,
                Mortarman </em></p>
            </div>
"""

detail_entry_pattern = r"(<li>(\d\d-\d\d\d\d)&nbsp; <a.+?>(.+?)\ *</a>.+?<div.+?<p>(.+?)</p>.+?<p>(.*?)</p>)"
examples_pattern = r"Illustrative examples: <em>(.+?)</em>"

entries = {}
for detail_entry in re.finditer(detail_entry_pattern, body, flags=re.DOTALL):
    code = detail_entry.group(2)
    title = " ".join(detail_entry.group(3).split())
    descr = " ".join(detail_entry.group(4).split())
    # some descriptions have a "Excludes ..." sentence that we do not want,
    # since it is meaningless to claimants and provides false hits in search.
    if ". Excludes" in descr:
        descr = re.sub(r". Excludes .+?\.", ".", descr, flags=re.DOTALL)

    # not all entries have examples
    if len(detail_entry.group(5)):
        examples = " ".join(
            re.match(examples_pattern, detail_entry.group(5), flags=re.DOTALL)
            .group(1)
            .split()
        ).replace(" , ", ", ")
    else:
        examples = None

    # single letter keys to save space
    detail = {"c": code, "t": title, "d": descr, "e": examples}
    entries[code] = detail

# some quality checks
expected_ids = ["19-3011", "11-9041"]
for id in expected_ids:
    if id not in body:
        raise Exception("HTML prep removed entry {}".format(id))
    if id not in entries:
        raise Exception("failed to parse entry {}".format(id))

print(json.dumps(entries))
