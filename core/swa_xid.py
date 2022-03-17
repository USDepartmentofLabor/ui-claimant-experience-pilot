# -*- coding: utf-8 -*-
#
# AR format: yyyyMMdd-HHmmss-FFFFFF-randomint
# anything that starts with a iso8601-like pattern will be treated as a timestamp

import re
from django.conf import settings
from dateutil.parser import parse
from dateutil.tz import gettz
import logging

logger = logging.getLogger(__name__)


class SwaXid(object):
    def __init__(self, swa_xid, swa_code):
        self.swa_xid = swa_xid
        self.swa_code = swa_code
        self.datetime = None
        try:
            self.parse()
        except ValueError as err:
            logger.exception(err)

    def __str__(self):
        return self.swa_xid

    def as_isoformat(self):
        if self.datetime:
            return self.datetime.isoformat()
        return False

    def format_ok(self):
        pattern = settings.SWA_XID_PATTERNS.get(self.swa_code)
        if pattern and not re.match(pattern, self.swa_xid):
            return False

        swa_requires_datetime = settings.SWA_XID_TIMEZONES.get(self.swa_code)
        if swa_requires_datetime and not self.datetime:
            return False
        return True

    def parse(self):
        if not re.match(r"\d{8}.\d{6}", self.swa_xid):
            return
        parts = re.match(r"(\d{4})(\d\d)(\d\d).(\d\d)(\d\d)(\d\d)(.+)", self.swa_xid)
        # intentionally ignore microseconds. rounding error is irrelevant.
        ymd = "-".join(list(parts.group(1, 2, 3)))
        hms = ":".join(list(parts.group(4, 5, 6)))
        timestamp_str = f"{ymd} {hms} {self.swa_code}"
        tzinfos = {
            self.swa_code: gettz(settings.SWA_XID_TIMEZONES.get(self.swa_code, "UTC"))
        }
        self.datetime = parse(timestamp_str, tzinfos=tzinfos).astimezone(gettz("UTC"))
