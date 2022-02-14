# -*- coding: utf-8 -*-
from dataclasses import dataclass
from typing import Optional


@dataclass
class WhoAmIAddress:
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None

    def as_dict(self):
        return self.__dict__


@dataclass
class WhoAmI:
    email: str
    IAL: str = "2"
    csrfmiddlewaretoken: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    birthdate: Optional[str] = None
    ssn: Optional[str] = None
    phone: Optional[str] = None
    claimant_id: Optional[str] = None
    claim_id: Optional[str] = None
    swa_code: Optional[str] = None
    swa_name: Optional[str] = None
    swa_claimant_url: Optional[str] = None
    address: Optional[WhoAmIAddress] = None

    def as_dict(self):
        serialized = self.__dict__
        if "address" in serialized and isinstance(serialized["address"], WhoAmIAddress):
            serialized["address"] = self.address.as_dict()
        return serialized
