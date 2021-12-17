# -*- coding: utf-8 -*-
from django.test import Client, RequestFactory, TestCase
from django.core import mail
from django.utils import timezone
from django.conf import settings
from unittest.mock import patch
import boto3
from jwcrypto.common import json_decode
from botocore.stub import Stubber
from core.tasks_tests import CeleryTestCase
from .test_utils import create_idp, create_swa, create_claimant
from .models import Claim, Claimant
from core.test_utils import create_s3_bucket, delete_s3_bucket
from .claim_request import (
    ClaimRequest,
    MISSING_SWA_CODE,
    INVALID_SWA_CODE,
    MISSING_CLAIMANT_ID,
    INVALID_CLAIMANT_ID,
    INVALID_CLAIM_ID,
)
from .claim_validator import ClaimValidator, CompletedClaimValidator
import uuid
import logging
from core.claim_encryption import (
    AsymmetricClaimDecryptor,
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
from core.claim_storage import ClaimReader
from .claim_finder import ClaimFinder
from .whoami import WhoAmI


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


class SessionVerifier:
    def verify_session(self, client=None):
        client = client if client else self.client
        session = client.session
        session["verified"] = True
        session["whoami"] = {"email": "someone@example.com"}
        session.save()
        return session


class ApiTestCase(CeleryTestCase, SessionVerifier):
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

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def csrf_client(self, claimant=None, swa=None):
        # by default self.client relaxes the CSRF check, so we create our own client to test.
        c = Client(enforce_csrf_checks=True)
        self.verify_session(c)
        if swa and claimant:
            session = c.session
            session["swa"] = swa.code
            session["whoami"]["claimant_id"] = claimant.idp_user_xid
            session.save()
        return c

    def test_whoami(self):
        self.verify_session()
        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["email"], "someone@example.com")
        # only GET allowed
        response = self.client.post("/api/whoami/")
        self.assertEqual(response.status_code, 405)

    def test_whoami_swa(self):
        session = self.verify_session()
        session["swa"] = "XX"
        session.save()

        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["swa_code"], "XX")
        self.assertEqual(whoami["swa_name"], "SomeState")
        self.assertEqual(whoami["swa_claimant_url"], "https://somestate.gov")

    def test_whoami_unverified(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-verified session"})

    def test_index(self):
        response = self.client.get("/api/")
        about_api = response.json()
        self.assertEqual(about_api["version"], "1.0")
        # only GET allowed
        response = self.client.post("/api/")
        self.assertEqual(response.status_code, 405)

    def test_claim_unverified(self):
        response = self.client.get("/api/whoami/")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json(), {"error": "un-verified session"})

    def test_claim_without_csrf(self):
        csrf_client = self.csrf_client()
        response = csrf_client.post(
            "/api/completed-claim/", content_type="application/json", data={}
        )
        self.assertEqual(response.status_code, 403)

    def test_encrypted_completed_claim(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/completed-claim/"
        payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "email": "someone@example.com",
            "is_complete": True,
            "claimant_name": {
                "first_name": "Ima",
                "last_name": "Claimant",
            },
            "mailing_address": MAILING_ADDRESS,
            "residence_address": RESIDENCE_ADDRESS,
        }
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
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

    def test_completed_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant)
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/completed-claim/"
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}

        # GET completed claim (we don't have one yet)
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 404)

        # POST to create
        payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "email": "someone@example.com",
            "claimant_name": {
                "first_name": "Ima",
                "last_name": "Claimant",
            },
            "is_complete": True,
            "residence_address": RESIDENCE_ADDRESS,
            "mailing_address": MAILING_ADDRESS,
        }
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        self.assertEqual(response.status_code, 201)
        claim = claimant.claim_set.all()[0]
        self.assertEqual(
            response.json(), {"status": "accepted", "claim_id": str(claim.uuid)}
        )
        self.assertTrue(claim.is_completed())
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STORED).count(), 1
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
        self.assertEqual(claim_response["status"], None)
        self.assertEqual(len(claim_response["events"]), 3)

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
        self.assertIn("'1234' is not a 'date'", response.json()["errors"])

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
        self.assertEqual(
            response.json(), {"status": "accepted", "claim_id": str(claim.uuid)}
        )

        # GET partial claim
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["id"], str(claim.uuid))
        self.assertTrue(response_payload["identity_provider"])

        # GET partial claim, uncached
        session = csrf_client.session
        del session["partial_claim"]
        session.save()
        response = csrf_client.get(url, content_type="application/json", **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["id"], str(claim.uuid))
        self.assertTrue(response_payload["identity_provider"])

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
        self.assertEqual(response.status_code, 400)
        self.assertIn("'1234' is not a 'date'", response.json()["errors"])

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
        self.assertFalse("verified" in self.client.session)
        response = self.client.post("/api/login/", {"email": "someone@example.com"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["verified"])

    def test_login_json(self):
        self.assertFalse("verified" in self.client.session)
        response = self.client.post(
            "/api/login/",
            data={"email": "someone@example.com"},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["verified"])

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


class ClaimApiTestCase(TestCase, SessionVerifier):
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

    def test_claim_request(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        self.verify_session()

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


class ClaimValidatorTestCase(TestCase):
    def test_example_claim_instance(self):
        example = settings.BASE_DIR / "schemas" / "claim-v1.0-example.json"
        with open(example) as f:
            json_str = f.read()
        example_claim = json_decode(json_str)
        cv = ClaimValidator(example_claim)
        logger.debug("errors={}".format(cv.errors_as_dict()))
        self.assertTrue(cv.valid)
        ccv = CompletedClaimValidator(example_claim)
        logger.debug("errors={}".format(ccv.errors_as_dict()))
        self.assertTrue(ccv.valid)

    def base_claim(self):
        return {
            "id": str(uuid.uuid4()),
            "claimant_id": "random-claimaint-string",
            "identity_provider": "test",
            "swa_code": "XX",
            "birthdate": "2000-01-01",
            "ssn": "900-00-1234",
            "email": "foo@example.com",
            "claimant_name": {"first_name": "first", "last_name": "last"},
            "residence_address": RESIDENCE_ADDRESS,
            "mailing_address": MAILING_ADDRESS,
        }

    def test_claim_validator(self):
        claim = self.base_claim()
        cv = ClaimValidator(claim)
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234", "email": "foo"}
        cv = ClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        self.assertEqual(len(cv.errors), 3)
        error_dict = cv.errors_as_dict()
        self.assertIn("'1234' is not a 'date'", error_dict)
        self.assertIn("'foo' is not a 'email'", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)
        logger.debug("errors={}".format(error_dict))

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

        citizen_claim = self.base_claim() | {
            "us_citizenship": {
                "is_citizen": False,
                "alien_registration_number": "abc",
                "alien_registration_type": "resident",
            }
        }
        cv = ClaimValidator(citizen_claim)
        self.assertTrue(cv.valid)

        citizen_claim = self.base_claim() | {
            "us_citizenship": {"is_citizen": True, "alien_registration_number": "abc"}
        }
        # schema is valid but non-sensical
        cv = ClaimValidator(citizen_claim)
        self.assertTrue(cv.valid)

        citizen_claim = self.base_claim() | {"us_citizenship": {"is_citizen": False}}
        cv = ClaimValidator(citizen_claim)
        self.assertFalse(cv.valid)
        error_dict = cv.errors_as_dict()
        logger.debug("errors={}".format(error_dict))
        self.assertIn(
            "'alien_registration_number' is a required property",
            list(error_dict.keys()),
        )

    def test_completed_claim_validator(self):
        claim = self.base_claim() | {
            "validated_at": timezone.now().isoformat(),
        }
        cv = CompletedClaimValidator(claim)
        logger.debug(cv.errors_as_dict())
        self.assertTrue(cv.valid)

        invalid_claim = {"birthdate": "1234"}
        cv = CompletedClaimValidator(invalid_claim)
        self.assertFalse(cv.valid)
        self.assertEqual(len(cv.errors), 8)
        error_dict = cv.errors_as_dict()
        logger.debug("errors: {}".format(error_dict))
        self.assertIn("'1234' is not a 'date'", error_dict)
        # TODO self.assertIn("'ssn' is a required property", error_dict)
        # TODO self.assertIn("'email' is a required property", error_dict)
        self.assertIn("'residence_address' is a required property", error_dict)
        self.assertIn("'mailing_address' is a required property", error_dict)
        self.assertIn("'claimant_name' is a required property", error_dict)
