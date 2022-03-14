# -*- coding: utf-8 -*-
# define some custom exception classes


class ClaimStorageError(Exception):
    pass


class SwaXidError(Exception):
    def __init__(self, swa, message):
        self.swa = swa
        super().__init__(message)


class MalformedSwaXidError(SwaXidError):
    pass


class MissingSwaXidError(SwaXidError):
    pass
