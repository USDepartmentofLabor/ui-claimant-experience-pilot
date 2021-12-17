# -*- coding: utf-8 -*-
from dataclasses import dataclass


@dataclass
class WhoAmI:
    email: str
    csrfmiddlewaretoken: str = None
    first_name: str = None
    last_name: str = None
    birthdate: str = None
    ssn: str = None
    phone: str = None
    claimant_id: str = None
    claim_id: str = None
    swa_code: str = None
    swa_name: str = None
    swa_claimant_url: str = None

    def as_dict(self):
        return self.__dict__
