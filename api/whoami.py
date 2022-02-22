# -*- coding: utf-8 -*-
from dataclasses import dataclass
from typing import Optional
import re


@dataclass
class WhoAmIAddress:
    address1: Optional[str] = None
    address2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zipcode: Optional[str] = None

    def as_dict(self):
        return {k: v for k, v in self.__dict__.items() if v is not None}


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
    verified_at: Optional[str] = None
    identity_provider: str = "login.gov"

    def as_dict(self):
        serialized = self.__dict__
        if "address" in serialized and isinstance(serialized["address"], WhoAmIAddress):
            serialized["address"] = self.address.as_dict()
        return serialized

    def as_identity(self):
        identity = {
            "$schema": "https://unemployment.dol.gov/schemas/identity-v1.0.json",
            "id": self.claim_id,
            "claimant_id": self.claimant_id,
            "identity_provider": self.identity_provider,
            "identity_assurance_level": int(self.IAL),
            "swa_code": self.swa_code,
            "email": self.email,
        }
        if self.IAL == "2":
            identity["verified_at"] = self.verified_at
            identity["address"] = self.address.as_dict()
            identity["ssn"] = re.sub(
                r"^([0-9]{3})-?([0-9]{2})-?([0-9]{4})$",
                r"\1-\2-\3",
                self.ssn,
            )
            identity["phone"] = self.phone
            identity["first_name"] = self.first_name
            identity["last_name"] = self.last_name
            identity["birthdate"] = self.birthdate
        return identity
