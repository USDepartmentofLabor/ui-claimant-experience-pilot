# -*- coding: utf-8 -*-
from django.test import Client, RequestFactory, TestCase
from django.core import mail
from django.utils import timezone
from django.conf import settings
from django.test.utils import override_settings
from unittest.mock import patch
import boto3
from jwcrypto.common import json_decode
from botocore.stub import Stubber
from dacite import from_dict
from core.tasks_tests import CeleryTestCase
from .test_utils import create_idp, create_swa, create_claimant
from .models import Claim, Claimant
from .models.claim import CLAIMANT_STATUS_PROCESSING
from core.test_utils import create_s3_bucket, delete_s3_bucket
from .claim_request import (
    ClaimRequest,
    MISSING_SWA_CODE,
    INVALID_SWA_CODE,
    MISSING_CLAIMANT_ID,
    INVALID_CLAIMANT_ID,
    INVALID_CLAIM_ID,
)
from .claim_validator import ClaimValidator
import uuid
import logging
from core.claim_encryption import (
    AsymmetricClaimDecryptor,
    SymmetricClaimEncryptor,
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
from core.claim_storage import (
    BUCKET_TYPE_ARCHIVE,
    ClaimBucket,
    ClaimReader,
    ClaimStore,
    ClaimWriter,
)
from .claim_finder import ClaimFinder
from .whoami import WhoAmI
from .claim_cleaner import ClaimCleaner
from os import listdir
from os.path import isfile, join, isdir
from datetime import timedelta
import time_machine

logger = logging.getLogger("api.tests")

MAILING_ADDRESS = {
    "address1": "456 Any St",
    "city": "Somewhere",
    "state": "KS",
    "zipcode": "00000",
}

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


class SessionAuthenticator:
    def authenticate_session(self, client=None):
        client = client if client else self.client
        session = client.session
        session["authenticated"] = True
        session["whoami"] = WHOAMI_IAL2
        session.save()
        return session


class BaseClaim:
    def base_claim(
        self, id=str(uuid.uuid4()), claimant_id=None, email=None, swa_code=None
    ):
        identity = from_dict(
            data_class=WhoAmI,
            data=WHOAMI_IAL2
            | {
                "claim_id": id,
                "swa_code": (swa_code or "XX"),
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
            "education_level": "some_college",
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
            "self_employment": {
                "is_self_employed": False,
                "ownership_in_business": True,
                "name_of_business": "BusinessCo",
                "is_corporate_officer": True,
                "name_of_corporation": "ACME Inc",
                "related_to_owner": False,
            },
            "student_fulltime_in_last_18_months": False,
            "attending_college_or_job_training": True,
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
                "type_of_disability": "State Plan",
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


class ApiTestCase(CeleryTestCase, SessionAuthenticator, BaseClaim):
    maxDiff = None

    def setUp(self):
        super().setUp()
        # Empty the test outbox
        mail.outbox = []
        create_swa(
            is_active=True,
            code="XX",
            name="SomeState",
            claimant_url="https://somestate.gov",
        )

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()
        create_s3_bucket(is_archive=True)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()
        delete_s3_bucket(is_archive=True)

    def csrf_client(self, claimant=None, swa=None):
        # by default self.client relaxes the CSRF check, so we create our own client to test.
        c = Client(enforce_csrf_checks=True)
        self.authenticate_session(c)
        if swa and claimant:
            session = c.session
            session["swa"] = swa.code
            session["whoami"]["claimant_id"] = claimant.idp_user_xid
            session["whoami"]["swa_code"] = swa.code
            session.save()
        return c

    def test_whoami(self):
        self.authenticate_session()
        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["email"], "someone@example.com")
        # only GET allowed
        response = self.client.post("/api/whoami/")
        self.assertEqual(response.status_code, 405)

    def test_whoami_swa(self):
        session = self.authenticate_session()
        session["swa"] = "XX"
        session.save()

        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["swa_code"], "XX")
        self.assertEqual(whoami["swa_name"], "SomeState")
        self.assertEqual(whoami["swa_claimant_url"], "https://somestate.gov")

    def test_whoami_no_authentication(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-authenticated session"})

    def test_index(self):
        response = self.client.get("/api/")
        about_api = response.json()
        self.assertEqual(about_api["version"], "1.0")
        # only GET allowed
        response = self.client.post("/api/")
        self.assertEqual(response.status_code, 405)

    def test_claim_no_authentication(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-authenticated session"})

    def test_claim_without_csrf(self):
        csrf_client = self.csrf_client()
        response = csrf_client.post(
            "/api/completed-claim/", content_type="application/json", data={}
        )
        self.assertEqual(response.status_code, 403)

    def test_response_cookies_should_not_have_expire_setting(self):
        csrf_client = self.csrf_client()
        response = csrf_client.get("/api/whoami/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.cookies), 3)
        self.assertEqual(response.cookies["sessionid"]["expires"], "")
        self.assertEqual(response.cookies["csrftoken"]["expires"], "")
        self.assertEqual(response.cookies["expires_at"]["expires"], "")

    def test_encrypted_completed_claim(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client()
        whoami = csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/completed-claim/"
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=whoami["email"],
            swa_code=swa.code,
        )
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        logger.debug("🚀🚀🚀🚀🚀 debug={}".format(response))
        self.assertEqual(response.status_code, 201)

        # fetch the encrypted claim from the S3 bucket directly and decrypt it.
        claim = claimant.claim_set.all()[0]
        self.assertTrue(claim.is_completed())
        claim_id = response.json()["claim_id"]
        cr = ClaimReader(claim)
        packaged_claim_str = cr.read()
        acd = AsymmetricClaimDecryptor(packaged_claim_str, private_key_jwk)
        decrypted_claim = acd.decrypt()
        self.assertEqual(acd.packaged_claim["claim_id"], claim_id)
        self.assertEqual(decrypted_claim["id"], claim_id)
        self.assertEqual(decrypted_claim["claimant_id"], claimant.idp_user_xid)

    def test_archived_claim(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client()
        whoami = csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/completed-claim/"
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=whoami["email"],
            swa_code=swa.code,
        )
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        logger.debug("🚀 {}".format(response.json()))
        self.assertEqual(response.status_code, 201)

        # fetch the completed claim from the archive S3 bucket directly.
        claim = claimant.claim_set.all()[0]
        self.assertTrue(claim.is_completed())
        claim_id = response.json()["claim_id"]
        cr = ClaimReader(
            claim,
            claim_store=ClaimStore(
                claim_bucket=ClaimBucket(bucket_type=BUCKET_TYPE_ARCHIVE)
            ),
        )
        archived_claim = json_decode(cr.read())
        self.assertEqual(archived_claim["id"], claim_id)
        self.assertEqual(archived_claim["claimant_id"], claimant.idp_user_xid)
        self.assertEqual(archived_claim["education_level"], payload["education_level"])

    def test_encrypted_partial_claim(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/partial-claim/"
        payload = {
            "claimant_name": {"first_name": "foo", "last_name": "bar"},
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "email": "someone@example.com",
            "mailing_address": MAILING_ADDRESS,
            "residence_address": RESIDENCE_ADDRESS,
            "LOCAL_mailing_address_same": False,
        }
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        self.assertEqual(response.status_code, 202)

        # fetch the encrypted claim from the S3 bucket directly and decrypt it.
        claim = claimant.claim_set.all()[0]
        self.assertFalse(claim.is_completed())

        claim_id = response.json()["claim_id"]
        self.assertEqual(str(claim.uuid), claim_id)

        cr = ClaimReader(claim)
        packaged_claim_str = cr.read()
        scd = SymmetricClaimDecryptor(packaged_claim_str, symmetric_encryption_key())
        decrypted_claim = scd.decrypt()
        self.assertEqual(scd.packaged_claim["claim_id"], claim_id)
        self.assertEqual(decrypted_claim["id"], claim_id)
        self.assertEqual(decrypted_claim["claimant_id"], claimant.idp_user_xid)
        self.assertEqual(decrypted_claim["ssn"], "900-00-1234")
        self.assertEqual(decrypted_claim["LOCAL_mailing_address_same"], False)

    def test_get_claims(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)

        # we don't really care about CSRF we just want whoami to reflect claimant+swa
        client = self.csrf_client(claimant, swa)
        response = client.get("/api/claims/")
        self.assertEqual(len(response.json()["claims"]), 0)

        claim = Claim(swa=swa, claimant=claimant, status="groovy")
        claim.save()
        claim2 = Claim(swa=swa, claimant=claimant)
        claim2.save()
        claim2.events.create(category=Claim.EventCategories.COMPLETED)
        response = client.get("/api/claims/")
        self.assertEqual(len(response.json()["claims"]), 2)
        self.assertEqual(response.json()["claims"][0]["id"], str(claim2.uuid))
        self.assertEqual(
            response.json()["claims"][0]["status"], CLAIMANT_STATUS_PROCESSING
        )
        self.assertTrue(response.json()["claims"][0]["completed_at"])
        self.assertFalse(response.json()["claims"][0]["deleted_at"])
        self.assertFalse(response.json()["claims"][0]["fetched_at"])
        self.assertFalse(response.json()["claims"][0]["resolved_at"])
        self.assertFalse(response.json()["claims"][0]["resolution"])
        self.assertEqual(response.json()["claims"][1]["id"], str(claim.uuid))
        self.assertEqual(response.json()["claims"][1]["status"], "groovy")
        self.assertFalse(response.json()["claims"][1]["completed_at"])
        self.assertFalse(response.json()["claims"][1]["deleted_at"])
        self.assertFalse(response.json()["claims"][1]["fetched_at"])
        self.assertFalse(response.json()["claims"][1]["resolved_at"])
        self.assertFalse(response.json()["claims"][1]["resolution"])

    def test_cancel_claim(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        client = self.csrf_client(claimant, swa)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)
        cw = ClaimWriter(claim, "test", path=claim.completed_payload_path())
        self.assertTrue(cw.write())
        self.assertTrue(claim.is_completed())
        self.assertFalse(claim.is_deleted())
        self.assertFalse(claim.is_resolved())

        client.get("/api/whoami/").json()  # trigger csrftoken cookie
        headers = {"HTTP_X_CSRFTOKEN": client.cookies["csrftoken"].value}
        response = client.delete(
            f"/api/cancel-claim/{claim.uuid}/",
            content_type="application/json",
            **headers,
        )
        self.assertEqual(response.json(), {"status": "ok"})
        claim.refresh_from_db()
        self.assertTrue(claim.is_completed())
        self.assertTrue(claim.is_deleted())
        self.assertTrue(claim.is_resolved())
        self.assertEqual(claim.resolution_description(), "cancelled by Claimant")

    def test_rotation_encrypted_partial_claim(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "id": str(claim.uuid),
        }

        # encrypt with an old key
        sym_encryptor = SymmetricClaimEncryptor(
            payload, symmetric_encryption_key(settings.CLAIM_SECRET_KEY[1])
        )
        packaged_claim = sym_encryptor.packaged_claim()
        packaged_payload = packaged_claim.as_json()
        cw = ClaimWriter(claim, packaged_payload, path=claim.partial_payload_path())
        self.assertTrue(cw.write())

        # then validate we can fetch with the newer key.
        csrf_client = self.csrf_client(claimant, swa)
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/partial-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.get(url, content_type="application/json", **headers)
        logger.debug("🚀 {}".format(response.json()))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["claim"], payload)

    def test_completed_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa)
        whoami = csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/completed-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}

        # GET completed claim (we don't have one yet)
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 404)

        # POST to create
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=whoami["email"],
            swa_code=swa.code,
        )
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        logger.debug(response.json())
        self.assertEqual(response.status_code, 201)
        claim = claimant.claim_set.all()[0]
        self.assertEqual(
            response.json(), {"status": "accepted", "claim_id": str(claim.uuid)}
        )
        self.assertTrue(claim.is_completed())
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.STORED, description=ClaimBucket().name
            ).count(),
            1,
        )
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.STORED,
                description=ClaimBucket(bucket_type=BUCKET_TYPE_ARCHIVE).name,
            ).count(),
            1,
        )
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.SUBMITTED).count(), 1
        )

        # this requires celery task to run to completion async,
        # so wait a little
        self.wait_for_workers_to_finish()
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "Your UI Claim receipt")

        # GET completed claim we have made
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        claim_response = response.json()
        self.assertEqual(claim_response["id"], str(claim.uuid))
        self.assertEqual(claim_response["status"], "processing")
        self.assertTrue(claim_response["completed_at"])

        # if we have another claim that is newer and completed, but resolved, ignore it.
        logger.debug("🚀 test we ignore resolved claim")
        completed_claim_uuid = str(claim.uuid)
        resolved_claim = Claim(claimant=claimant, swa=swa)
        resolved_claim.save()
        resolved_claim.events.create(category=Claim.EventCategories.COMPLETED)
        resolved_claim.events.create(category=Claim.EventCategories.RESOLVED)
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        claim_response = response.json()
        self.assertEqual(claim_response["id"], completed_claim_uuid)

        # only GET or POST allowed
        response = csrf_client.put(
            url, content_type="application/json", data={}, **headers
        )
        self.assertEqual(response.status_code, 405)

        # missing param returns error
        response = csrf_client.post(
            url, content_type="application/json", data={}, **headers
        )
        self.assertEqual(response.status_code, 400)

        # invalid claim payload returns error
        invalid_payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "1234",
            "is_complete": True,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=invalid_payload, **headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn(
            "'claimant_name' is a required property", response.json()["errors"]
        )

        # failure to write completed claim returns error
        with patch("core.claim_storage.ClaimStore.s3_client") as mocked_client:
            client = boto3.client("s3")
            stubber = Stubber(client)
            stubber.add_client_error("put_object")
            stubber.activate()
            mocked_client.return_value = client
            response = csrf_client.post(
                url, content_type="application/json", data=payload, **headers
            )
            logger.debug("🚀 expect error")
            self.assertEqual(response.status_code, 500)
            self.assertEqual(
                response.json(), {"status": "error", "error": "unable to save claim"}
            )

        # has is_complete but is not really complete
        invalid_payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "is_complete": True,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=invalid_payload, **headers
        )
        self.assertEqual(response.status_code, 400)
        logger.debug("missing complete fields")
        self.assertIn(
            "'claimant_name' is a required property", response.json()["errors"]
        )

        # does not try to be complete
        invalid_payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "is_complete": False,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=invalid_payload, **headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "is_complete payload false/missing at completed-claim endpoint",
        )

    def write_partial_claim_payload(self, claim, payload):
        sym_encryptor = SymmetricClaimEncryptor(payload, symmetric_encryption_key())
        packaged_claim = sym_encryptor.packaged_claim()
        packaged_payload = packaged_claim.as_json()
        cw = ClaimWriter(claim, packaged_payload, path=claim.partial_payload_path())
        self.assertTrue(cw.write())

    @override_settings(DELETE_PARTIAL_CLAIM_AFTER_DAYS=0)
    def test_partial_claim_expires_today(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa)
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/partial-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        self.write_partial_claim_payload(claim, {"id": str(claim.uuid)})
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 404)

    @override_settings(DELETE_PARTIAL_CLAIM_AFTER_DAYS=1)
    def test_partial_claim_expires_tomorrow(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa)
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/partial-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        self.write_partial_claim_payload(claim, {"id": str(claim.uuid)})
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["remaining_time"], "23:59:59")
        self.assertEqual(
            response.json()["expires"],
            str((claim.should_be_deleted_after() - timedelta(days=1)).date()),
        )

    def test_partial_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa)
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/partial-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}

        # does a partial claim already exist?
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 404)

        # GET claim with no saved artifact
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()

        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 404)

        # success
        payload = {
            "claimant_name": {"first_name": "foo", "last_name": "bar"},
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "residence_address": RESIDENCE_ADDRESS,
            "mailing_address": MAILING_ADDRESS,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        self.assertEqual(claimant.claim_set.count(), 2)
        claim = claimant.claim_set.order_by(
            "created_at"
        ).last()  # not the one we started with
        self.assertEqual(response.status_code, 202)
        self.assertEqual(response.json()["status"], "accepted")
        self.assertEqual(response.json()["claim_id"], str(claim.uuid))
        # we expect validation errors. payload is incomplete (not a base_claim)
        self.assertTrue("validation_errors" in response.json())

        # GET partial claim
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["claim"]["id"], str(claim.uuid))
        self.assertEqual(response_payload["status"], "ok")
        self.assertTrue(response_payload["remaining_time"])
        self.assertTrue(response_payload["expires"])

        # GET partial claim, uncached
        session = csrf_client.session
        del session["partial_claim"]
        session.save()
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["claim"]["id"], str(claim.uuid))
        self.assertEqual(response_payload["status"], "ok")
        self.assertTrue(response_payload["remaining_time"])
        self.assertTrue(response_payload["expires"])

        # only GET or POST allowed
        response = csrf_client.put(
            url, content_type="application/json", data={}, **headers
        )
        self.assertEqual(response.status_code, 405)

        # missing param returns error
        response = csrf_client.post(
            url, content_type="application/json", data={}, **headers
        )
        self.assertEqual(response.status_code, 400)

        # signal is_complete not isn't
        payload_that_lies = {
            "swa_code": swa.code,
            "claimant_id": claimant.idp_user_xid,
            "is_complete": True,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=payload_that_lies, **headers
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json()["error"],
            "is_complete payload sent to partial-claim endpoint",
        )

        invalid_payload = {
            "claimant_name": {"first_name": "foo", "last_name": "bar"},
            "claimant_id": claimant.idp_user_xid,
            "birthdate": "1234",
            "swa_code": swa.code,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=invalid_payload, **headers
        )
        self.assertEqual(response.status_code, 202)
        self.assertIn("'1234' is not a 'date'", response.json()["validation_errors"])

        # failure to write partial claim returns error
        payload_with_trouble = {
            "claimant_name": {"first_name": "foo", "last_name": "bar"},
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "email": "someone@example.com",
            "mailing_address": MAILING_ADDRESS,
            "residence_address": RESIDENCE_ADDRESS,
        }
        with patch("core.claim_storage.ClaimStore.s3_client") as mocked_client:
            client = boto3.client("s3")
            stubber = Stubber(client)
            stubber.add_client_error("put_object")
            stubber.activate()
            mocked_client.return_value = client
            response = csrf_client.post(
                url,
                content_type="application/json",
                data=payload_with_trouble,
                **headers,
            )
            logger.debug("🚀 expect error")
            self.assertEqual(response.status_code, 500)
            self.assertEqual(
                response.json(), {"status": "error", "error": "unable to save claim"}
            )

    def test_login(self):
        self.assertFalse("authenticated" in self.client.session)
        response = self.client.post(
            "/api/login/",
            {
                "email": "someone@example.com",
                "IAL": "2",
                "address.address1": "123 Main St",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["authenticated"])

    def test_login_json(self):
        self.assertFalse("authenticated" in self.client.session)
        response = self.client.post(
            "/api/login/",
            data={"email": "someone@example.com", "IAL": "2"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["authenticated"])

    def test_logout(self):
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie

        session_key = csrf_client.session.session_key
        self.assertTrue(csrf_client.session.exists(session_key))

        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            "/api/logout/",
            content_type="application/json",
            **headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(self.client.session.exists(session_key))

    @override_settings(SESSION_COOKIE_AGE=10)
    def test_session_expires(self):
        self.authenticate_session()
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 200)

        # Try again after session expires
        logger.debug("⚡️ NOW == {}".format(timezone.now()))
        logger.debug("forward -> {}".format(settings.SESSION_COOKIE_AGE + 10))
        the_future = timezone.now() + timedelta(
            seconds=settings.SESSION_COOKIE_AGE + 10
        )
        traveller = time_machine.travel(the_future)
        traveller.start()
        logger.debug("⚡️ travel -> NOW == {}".format(timezone.now()))
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        traveller.stop()


class ClaimApiTestCase(TestCase, SessionAuthenticator, BaseClaim):
    def create_api_claim_request(self, body):
        request = RequestFactory().post(
            "/api/claim/", content_type="application/json", data=body
        )
        request.session = self.client.session
        claim_request = ClaimRequest(request)
        return claim_request

    def test_claim_finder(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        claimant2 = Claimant(idp_user_xid="otheridp id", idp=idp)
        claimant2.save()
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)

        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant.idp_user_xid,
                swa_code=swa.code,
            )
        )
        self.assertEqual(claim, finder.find())

        finder = ClaimFinder(WhoAmI(email="foo@example.com", claim_id=claim.uuid))
        self.assertEqual(claim, finder.find())

        # error conditions
        finder = ClaimFinder(WhoAmI(email="foo@example.com"))
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(email="foo@example.com", claimant_id=claimant.idp_user_xid)
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(email="foo@example.com", claimant_id="nonesuch", swa_code=swa.code)
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(WhoAmI(email="foo@example.com", swa_code=swa.code))
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant.idp_user_xid,
                swa_code="nonesuch",
            )
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant2.idp_user_xid,
                swa_code=swa.code,
            )
        )
        self.assertFalse(finder.find())

        finder = ClaimFinder(
            WhoAmI(email="foo@example.com", claim_id=str(uuid.uuid4()))
        )
        self.assertFalse(finder.find())

        # multiple completed claims will ignore any resolved even if newer
        claim2 = Claim(claimant=claimant, swa=swa)
        claim2.save()
        claim2.events.create(category=Claim.EventCategories.COMPLETED)
        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant.idp_user_xid,
                swa_code=swa.code,
            )
        )
        self.assertEqual(claim2, finder.find())
        claim2.events.create(category=Claim.EventCategories.RESOLVED)
        self.assertEqual(claim, finder.find())

        # .all returns everything regardless of events
        finder = ClaimFinder(
            WhoAmI(
                email="foo@example.com",
                claimant_id=claimant.idp_user_xid,
                swa_code=swa.code,
            )
        )
        self.assertEqual(finder.all().count(), 2)

    def test_claim_cleaner(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        self.authenticate_session()

        body = self.base_claim() | {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "ssn": "666-00-0000",
            "email": "fake@example.com",
            "birthdate": "1999-12-12",
            "work_authorization": {
                "authorization_type": "permanent_resident",
                "alien_registration_number": "111111111",
                "authorized_to_work": True,
            },
        }
        claim_request = self.create_api_claim_request(body)
        claim_cleaner = ClaimCleaner(claim_request)
        cleaned_claim = claim_cleaner.cleaned()
        logger.debug("🚀 cleaned_claim={}".format(cleaned_claim))
        self.assertEqual(cleaned_claim["ssn"], "666-00-0000")
        self.assertEqual(cleaned_claim["email"], "fake@example.com")
        self.assertEqual(cleaned_claim["birthdate"], "1999-12-12")
        self.assertEqual(cleaned_claim["employers"][0]["fein"], "00-1234567")
        self.assertEqual(
            cleaned_claim["work_authorization"]["alien_registration_number"],
            "111-111-111",
        )

    def test_claim_request(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        self.authenticate_session()

        # happy path
        body = {"claimant_id": claimant.idp_user_xid, "swa_code": swa.code}
        claim_request = self.create_api_claim_request(body)
        self.assertFalse(claim_request.error)

        # missing swa
        body = {"claimant_id": claimant.idp_user_xid}
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, MISSING_SWA_CODE)
        self.assertEqual(claim_request.response.status_code, 400)

        # invalid swa
        body = {"claimant_id": claimant.idp_user_xid, "swa_code": "nonsense"}
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, INVALID_SWA_CODE)
        self.assertEqual(claim_request.response.status_code, 404)

        # missing claimant
        body = {"swa_code": swa.code}
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, MISSING_CLAIMANT_ID)
        self.assertEqual(claim_request.response.status_code, 400)

        # invalid claimant
        body = {"swa_code": swa.code, "claimant_id": "nonsense"}
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, INVALID_CLAIMANT_ID)
        self.assertEqual(claim_request.response.status_code, 404)

        # invalid claim (bad id)
        body = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "id": str(uuid.uuid4()),
        }
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, INVALID_CLAIM_ID)
        self.assertEqual(claim_request.response.status_code, 404)

        # invalid claim (belongs to a different claimant)
        diff_claimant = Claimant(idp=idp, idp_user_xid="diff claimant")
        diff_claimant.save()
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        body = {
            "claimant_id": diff_claimant.idp_user_xid,
            "swa_code": swa.code,
            "id": claim.uuid,
        }
        claim_request = self.create_api_claim_request(body)
        self.assertTrue(claim_request.error)
        self.assertEqual(claim_request.error, INVALID_CLAIM_ID)
        self.assertEqual(claim_request.response.status_code, 401)

        # valid claim
        claim = Claim(claimant=claimant, swa=swa)
        claim.save()
        body = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "id": claim.uuid,
        }
        claim_request = self.create_api_claim_request(body)
        self.assertFalse(claim_request.error)
        self.assertEqual(claim.id, claim_request.claim.id)


class ClaimValidatorTestCase(TestCase, BaseClaim):
    def test_example_claim_instance(self):
        example = settings.BASE_DIR / "schemas" / "claim-v1.0-example.json"
        with open(example) as f:
            json_str = f.read()
        example_claim = json_decode(json_str)
        cv = ClaimValidator(example_claim)
        logger.debug("🚀 claim errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

    def test_example_identity_instances(self):
        for ial in [1, 2]:
            example = (
                settings.BASE_DIR / "schemas" / f"identity-v1.0-example-ial{ial}.json"
            )
            with open(example) as f:
                json_str = f.read()
            cv = ClaimValidator(json_decode(json_str), schema_name="identity-v1.0")
            logger.debug("🚀 IAL{} identity errors={}".format(ial, cv.errors_as_dict()))
            self.assertTrue(cv.valid)

    def test_claim_permutations(self):
        dirlist = settings.FIXTURE_DIR
        fixtures = [f for f in listdir(dirlist) if isdir(join(dirlist, f))]
        for fixture in fixtures:
            for validity in ["valid", "invalid"]:
                fixture_dir = dirlist / fixture / validity
                cases = [
                    f for f in listdir(fixture_dir) if isfile(join(fixture_dir, f))
                ]
                for case in cases:
                    claim = self.base_claim()
                    with open(fixture_dir / case) as f:
                        json = json_decode(f.read())
                    for key in json:
                        claim[key] = json[key]
                    cv = ClaimValidator(claim)
                    logger.debug(f"Checking fixture {fixture} / {validity} / {case}")
                    self.assertEqual(
                        cv.valid,
                        validity == "valid",
                        f"{fixture} / {validity} / {case}",
                    )

    def test_claim_validator(self):
        claim = self.base_claim()
        cv = ClaimValidator(claim)
        logger.debug("🚀 claim errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234", "email": "foo"}
        cv = ClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        self.assertEqual(len(cv.errors), 27)
        error_dict = cv.errors_as_dict()
        self.assertIn("'1234' is not a 'date'", error_dict)
        self.assertIn("'foo' is not a 'email'", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)

        invalid_ssn = {"ssn": "1234"}
        cv = ClaimValidator(invalid_ssn)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn(
            "'1234' does not match",
            list(filter(lambda e: "does not match" in e, error_dict.keys()))[0],
        )

        claim = self.base_claim() | {"random_field": "value"}
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn(
            "Additional properties are not allowed ('random_field' was unexpected)",
            error_dict,
        )

    def test_swa_required_fields(self):
        claim = self.base_claim() | {
            "worked_in_other_states": ["CA", "WV"],
        }
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "worked_in_other_states": ["CA", "WV", "XX"],
        }
        del claim["claimant_name"]
        cv = ClaimValidator(claim)
        error_dict = cv.errors_as_dict()
        self.assertFalse(cv.valid)
        self.assertIn("'claimant_name' is a required property", error_dict)
        self.assertIn(
            "'XX' is not one of",
            list(filter(lambda e: "XX" in e, error_dict.keys()))[0],
        )

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "permanent_resident",
                "alien_registration_number": "111-111-111",
                "authorized_to_work": True,
            }
        }
        cv = ClaimValidator(claim)
        logger.debug("errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "alien_registration_number": "111-111-111",
                "authorized_to_work": True,
            }
        }
        # schema is valid but non-sensical
        cv = ClaimValidator(claim)
        logger.debug("errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "authorized_to_work": False,
            }
        }
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        logger.debug("errors={}".format(error_dict))
        self.assertIn(
            "'not_authorized_to_work_explanation' is a required property",
            list(error_dict.keys()),
        )

        claim = self.base_claim() | {
            "work_authorization": {
                "authorization_type": "US_citizen_or_national",
                "authorized_to_work": False,
                "not_authorized_to_work_explanation": "something is wrong",
            }
        }
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        # union membership
        union_claim = self.base_claim() | {"union": {"is_union_member": False}}
        cv = ClaimValidator(union_claim)
        error_dict = cv.errors_as_dict()
        logger.debug("🚀 errors={}".format(error_dict))
        self.assertTrue(cv.valid)
        union_claim = self.base_claim() | {"union": {"is_union_member": True}}
        cv = ClaimValidator(union_claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        logger.debug("🚀 errors={}".format(error_dict))
        self.assertIn(
            "'union_name' is a required property",
            list(error_dict.keys()),
        )
        union_claim = self.base_claim() | {
            "union": {
                "is_union_member": True,
                "union_name": "foo",
                "union_local_number": "1234",
                "required_to_seek_work_through_hiring_hall": False,
            }
        }
        cv = ClaimValidator(union_claim)
        self.assertTrue(cv.valid)

    def test_completed_claim_validator(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        cv = ClaimValidator(claim)
        logger.debug("🚀 LOCAL_")
        logger.debug(cv.errors_as_dict())
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234"}
        cv = ClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        self.assertEqual(len(cv.errors), 27)
        error_dict = cv.errors_as_dict()
        logger.debug("errors: {}".format(error_dict))
        self.assertIn("'1234' is not a 'date'", error_dict)
        self.assertIn("'ssn' is a required property", error_dict)
        self.assertIn("'email' is a required property", error_dict)
        self.assertIn("'residence_address' is a required property", error_dict)
        self.assertIn("'mailing_address' is a required property", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)
        self.assertIn("'payment' is a required property", error_dict)

    def test_employer_conditionals(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        del claim["employers"][0]["last_work_date"]
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("'last_work_date' is a required property", error_dict)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["separation_reason"] = "still_employed"
        del claim["employers"][0]["last_work_date"]
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        del claim["employers"][0]["separation_option"]
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("'separation_option' is a required property", error_dict)

        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["separation_reason"] = "retired"
        del claim["employers"][0]["separation_option"]
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

    def test_local_validation_rules(self):
        # first work date later than last work date
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        claim["employers"][0]["first_work_date"] = "2022-02-01"
        claim["employers"][0]["last_work_date"] = "2022-01-01"
        cv = ClaimValidator(claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        self.assertIn("first_work_date is later than last_work_date", error_dict)

    def test_nested_conditional_validation(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        # Delete attribute required by nested conditional
        del claim["disability"]["contacted_last_employer_after_recovery"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertFalse(cv.valid)

        # Delete attribute requiring previously-deleted conditional
        del claim["disability"]["recovery_date"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertTrue(cv.valid)

        del claim["payment"]["account_type"]
        cv = ClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertFalse(cv.valid)


class WhoAmITestCase(TestCase):
    def test_whoami_address(self):
        attrs = WHOAMI_IAL2 | {"address": {"address1": "123 Any St", "state": "XX"}}
        whoami = from_dict(data_class=WhoAmI, data=attrs)
        self.assertEqual(whoami.address.state, "XX")

    def test_whoami_optional_attributes(self):
        whoami = from_dict(
            data_class=WhoAmI, data={"email": "foo@example.com", "claimant_id": None}
        )
        self.assertEqual(whoami.claimant_id, None)
