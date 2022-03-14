# -*- coding: utf-8 -*-
from .models import IdentityProvider, SWA, Claim, Claimant
from core.test_utils import generate_keypair
from datetime import timedelta
from django.utils import timezone
import time_machine
import copy

RESIDENCE_ADDRESS = {
    "address1": "123 Any St",
    "city": "Somewhere",
    "state": "KS",
    "zipcode": "00000",
}

WHOAMI_IAL2 = {
    "email": "someone@example.com",
    "IAL": "2",
    "first_name": "Some",
    "last_name": "One",
    "birthdate": "1990-05-04",
    "ssn": "900001234",  # omit hyphen to test claim cleaner
    "phone": "555-555-1234",
    "address": RESIDENCE_ADDRESS,
    "verified_at": "2022-02-17T17:28:27-06:00",
}

TEST_SWA = {
    "claimant_url": "https://somestate.gov",
    "name": "SomeState",
    "code": "XX",
    "featureset": "Claim And Identity",
}


def create_whoami():
    return copy.deepcopy(WHOAMI_IAL2 | {"swa": TEST_SWA})


def create_idp():
    idp = IdentityProvider(name="my identity provider")
    idp.save()
    return idp


def create_swa(
    is_active=False,
    code="KS",
    name=None,
    claimant_url=None,
    featureset=SWA.FeatureSetOptions.CLAIM_AND_IDENTITY,
):
    private_key_jwk, public_key_jwk = generate_keypair()

    # ad astra per aspera (the KS state motto)
    swa = SWA(
        code=code,
        name=name or f"{code} state name",
        public_key=public_key_jwk.export_to_pem().decode("utf-8"),
        public_key_fingerprint=public_key_jwk.thumbprint(),
        claimant_url=claimant_url or "https://some.fake.url",
        featureset=featureset,
    )
    if is_active:
        swa.status = SWA.StatusOptions.ACTIVE
    swa.save()
    return swa, private_key_jwk


def create_swa_xid(swa):
    if swa.code == "AR":
        now = timezone.now()
        return f"{now.strftime('%Y%m%d-%H%M%S')}-1234567-123456789"
    else:
        return "abc-123"


def create_claimant(idp, **kwargs):
    claimant_options = {"idp_user_xid": "my-idp-id"}
    claimant_options.update(kwargs)
    claimant = Claimant(
        idp_user_xid=claimant_options["idp_user_xid"],
        idp=idp,
    )
    claimant.save()
    return claimant


def build_claim_updated_by_event(idp, swa, idp_user_xid, uuid, events=None):
    if events is None:
        events = [{"category": Claim.EventCategories.STORED, "days_ago_happened_at": 0}]
    claimant = create_claimant(idp, idp_user_xid=idp_user_xid)

    claim = Claim(
        uuid=uuid,
        swa=swa,
        claimant=claimant,
        status="something",
    )
    claim.save()

    for event in events:
        claim.events.create(
            category=event["category"],
            happened_at=timezone.now() - timedelta(days=event["days_ago_happened"]),
            description="some other thing",
        )
    traveller = time_machine.travel(
        timezone.now() - timedelta(days=events[-1]["days_ago_happened"])
    )
    traveller.start()
    claim.save()  # updates claim.updated_at to the last event date
    traveller.stop()

    return claim
