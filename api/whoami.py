# -*- coding: utf-8 -*-
from dataclasses import dataclass


@dataclass
class WhoAmIAddress:
    address1: str = None
    address2: str = None
    city: str = None
    state: str = None
    zipcode: str = None

    def as_dict(self):
        return self.__dict__


@dataclass
class WhoAmI:
    email: str
    IAL: str = "2"
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
    address: WhoAmIAddress = None

    def as_dict(self):
        serialized = self.__dict__
        if "address" in serialized and isinstance(serialized["address"], WhoAmIAddress):
            serialized["address"] = self.address.as_dict()
        return serialized
