# -*- coding: utf-8 -*-
from .models import IdentityProvider, SWA, Claim, Claimant
from core.test_utils import generate_keypair
from datetime import timedelta
from django.utils import timezone
from api.whoami import WhoAmI
import time_machine
import copy
import uuid

RESIDENCE_ADDRESS = {
    "address1": "123 Any St",
    "city": "Somewhere",
    "state": "KS",
    "zipcode": "00000",
}

MAILING_ADDRESS = {
    "address1": "456 Any St",
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
    fullname=None,
    claimant_url=None,
    featureset=SWA.FeatureSetOptions.CLAIM_AND_IDENTITY,
):
    private_key_jwk, public_key_jwk = generate_keypair()

    # ad astra per aspera (the KS state motto)
    swa = SWA(
        code=code,
        name=name or f"{code} state name",
        fullname=fullname or f"{code} full name",
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


def build_claim_updated_by_event(idp, swa, idp_user_xid, uuid, events):
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


class BaseClaim:
    def base_claim(
        self, id=str(uuid.uuid4()), claimant_id=None, email=None, swa_code=None
    ):
        identity = WhoAmI.from_dict(
            WHOAMI_IAL2
            | {
                "claim_id": id,
                "swa": TEST_SWA | {"code": (swa_code or TEST_SWA["code"])},
                "claimant_id": (claimant_id or "random-claimaint-string"),
            },
        ).as_identity()
        claim = {
            "is_complete": True,
            "claimant_id": identity["claimant_id"],
            "idp_identity": identity,
            "swa_code": identity["swa_code"],
            "ssn": "900-00-1234",
            "email": email or "foo@example.com",
            "claimant_name": {"first_name": "first", "last_name": "last"},
            "residence_address": RESIDENCE_ADDRESS,
            "mailing_address": MAILING_ADDRESS,
            "birthdate": "2000-01-01",
            "sex": "female",
            "ethnicity": "opt_out",
            "race": ["american_indian_or_alaskan"],
            "education_level": "bachelors",
            "state_credential": {
                "drivers_license_or_state_id_number": "111222333",
                "issuer": "GA",
            },
            "employers": [
                {
                    "name": "ACME Stuff",
                    "days_employed": 123,
                    "LOCAL_still_working": "no",
                    "first_work_date": "2020-02-02",
                    "last_work_date": "2020-11-30",
                    "recall_date": "2020-12-13",
                    "fein": "001234567",
                    "self_employed": False,
                    "address": {
                        "address1": "999 Acme Way",
                        "address2": "Suite 888",
                        "city": "Elsewhere",
                        "state": "KS",
                        "zipcode": "11111-9999",
                    },
                    "LOCAL_same_address": "no",
                    "work_site_address": {
                        "address1": "888 Sun Ave",
                        "city": "Elsewhere",
                        "state": "KS",
                        "zipcode": "11111-8888",
                    },
                    "LOCAL_same_phone": "yes",
                    "phones": [{"number": "555-555-1234", "sms": False}],
                    "separation_reason": "laid_off",
                    "separation_option": "position_eliminated",
                    "separation_comment": "they ran out of money",
                }
            ],
            "other_pay": [
                {
                    "pay_type": "severance",
                    "total": 500000,
                    "date_received": "2021-01-15",
                    "note": "All one payment for layoff",
                }
            ],
            "self_employment": {
                "is_self_employed": False,
                "ownership_in_business": True,
                "name_of_business": "BusinessCo",
                "is_corporate_officer": True,
                "name_of_corporation": "ACME Inc",
                "related_to_owner": False,
            },
            "attending_college_or_job_training": True,
            "type_of_college_or_job_training": "full_time_student",
            "registered_with_vocational_rehab": False,
            "union": {
                "is_union_member": True,
                "union_name": "foo",
                "union_local_number": "1234",
                "required_to_seek_work_through_hiring_hall": False,
            },
            "interpreter_required": True,
            "phones": [{"number": "555-555-1234"}],
            "disability": {
                "has_collected_disability": True,
                "disabled_immediately_before": False,
                "type_of_disability": "state_plan",
                "date_disability_began": "2020-01-01",
                "recovery_date": "2022-01-08",
                "contacted_last_employer_after_recovery": False,
            },
            "availability": {
                "can_begin_work_immediately": False,
                "cannot_begin_work_immediately_reason": "I have to deal with a family emergency for the next 2 weeks",
                "can_work_full_time": True,
                "is_prevented_from_accepting_full_time_work": False,
            },
            "federal_income_tax_withheld": False,
            "payment": {
                "payment_method": "direct_deposit",
                "account_type": "checking",
                "routing_number": "12-345678",
                "account_number": "00983-543=001",
            },
            "occupation": {
                "job_title": "nurse",
                "job_description": "ER nurse",
                "bls_description": "29-0000  Healthcare Practitioners and Technical Occupations",
                "bls_code": "29-1141",
                "bls_title": "Registered Nurses",
            },
            "work_authorization": {
                "authorization_type": "permanent_resident",
                "alien_registration_number": "111-111-111",
                "authorized_to_work": True,
            },
        }
        if id:
            claim["id"] = id
        return claim
