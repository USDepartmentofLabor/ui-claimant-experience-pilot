# -*- coding: utf-8 -*-
from django.test import Client, RequestFactory, TestCase
from django.core import mail
from django.utils import timezone
from django.conf import settings
from django.test.utils import override_settings
from unittest.mock import patch
from core.tasks_tests import CeleryTestCase
from core.test_utils import BucketableTestCase
from api.test_utils import (
    create_idp,
    create_swa,
    create_claimant,
    create_whoami,
    RESIDENCE_ADDRESS,
    MAILING_ADDRESS,
    TEST_SWA,
    BaseClaim,
)
from api.models import Claim, Claimant
from api.models.claim import CLAIMANT_STATUS_PROCESSING
from api.claim_request import (
    ClaimRequest,
    MISSING_SWA_CODE,
    INVALID_SWA_CODE,
    MISSING_CLAIMANT_ID,
    INVALID_CLAIMANT_ID,
    INVALID_CLAIM_ID,
)
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

import uuid
import logging
from datetime import timedelta
import time_machine
import boto3
from jwcrypto.common import json_decode
from botocore.stub import Stubber

logger = logging.getLogger(__name__)

JSON = "application/json"


class SessionAuthenticator:
    def authenticate_session(self, client=None):
        client = client if client else self.client
        session = client.session
        session["authenticated"] = True
        session["whoami"] = create_whoami()
        session.save()
        return session


# IMPORTANT that BucketableTestCase comes before CeleryTestCase
class ApiViewsTestCase(
    BucketableTestCase, CeleryTestCase, SessionAuthenticator, BaseClaim
):
    maxDiff = None

    def setUp(self):
        super().setUp()
        # Empty the test outbox
        mail.outbox = []
        create_swa(
            is_active=True,
            code=TEST_SWA["code"],
            name=TEST_SWA["name"],
            claimant_url=TEST_SWA["claimant_url"],
        )

    def csrf_client(self, claimant=None, swa=None, trigger_cookie=False):
        # by default self.client relaxes the CSRF check, so we create our own client to test.
        c = Client(enforce_csrf_checks=True)
        self.authenticate_session(c)
        if swa and claimant:
            session = c.session
            session["swa"] = swa.code
            session["whoami"]["claimant_id"] = claimant.idp_user_xid
            session["whoami"]["swa"] = swa.for_whoami()
            session.save()
        if trigger_cookie:
            c.get("/api/whoami/").json()
        return c

    def csrf_headers(self, csrf_client):
        return {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}

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
        self.assertEqual(
            whoami["swa"],
            {
                "code": "XX",
                "name": "SomeState",
                "claimant_url": "https://somestate.gov",
                "featureset": "Claim And Identity",
            },
        )

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

    # some endpoints accept GET and POST because of Django's routing limits.
    # verify that the POST actions require CSRF.
    def test_claim_without_csrf(self):
        csrf_client = self.csrf_client()
        for url in ["/api/completed-claim/", "/api/partial-claim/"]:
            response = csrf_client.post(url, content_type=JSON, data={})
            self.assertEqual(response.status_code, 403)
            self.assertContains(response, "CSRF verification failed", status_code=403)
            logger.debug("🚀 {} CSRF check: {}".format(url, response.content))

    def test_response_cookies_do_not_have_expire_setting(self):
        csrf_client = self.csrf_client()
        response = csrf_client.get("/api/whoami/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.cookies), 3)
        self.assertEqual(response.cookies["sessionid"]["expires"], "")
        self.assertEqual(response.cookies["csrftoken"]["expires"], "")
        self.assertEqual(response.cookies["expires_at"]["expires"], "")

    def test_response_cookies_have_secure_setting(self):
        csrf_client = self.csrf_client()
        response = csrf_client.get("/api/whoami/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.cookies), 3)
        self.assertTrue(response.cookies["sessionid"]["secure"])
        self.assertTrue(response.cookies["csrftoken"]["secure"])
        self.assertTrue(response.cookies["expires_at"]["secure"])

    def test_response_cookies_have_samesite_setting(self):
        csrf_client = self.csrf_client()
        response = csrf_client.get("/api/whoami/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.cookies), 3)
        self.assertNotEqual(response.cookies["sessionid"]["samesite"], "")
        self.assertNotEqual(response.cookies["csrftoken"]["samesite"], "")
        self.assertNotEqual(response.cookies["expires_at"]["samesite"], "")

    def test_encrypted_completed_claim(self):
        idp = create_idp()
        swa, private_key_jwk = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(trigger_cookie=True)
        url = "/api/completed-claim/"
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=csrf_client.session["whoami"]["email"],
            swa_code=swa.code,
        )
        headers = self.csrf_headers(csrf_client)
        response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
        csrf_client = self.csrf_client(trigger_cookie=True)
        url = "/api/completed-claim/"
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=csrf_client.session["whoami"]["email"],
            swa_code=swa.code,
        )
        headers = self.csrf_headers(csrf_client)
        response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
        csrf_client = self.csrf_client(trigger_cookie=True)
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
        headers = self.csrf_headers(csrf_client)
        response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
        client = self.csrf_client(claimant, swa, trigger_cookie=True)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)
        cw = ClaimWriter(claim, "test", path=claim.completed_payload_path())
        self.assertTrue(cw.write())
        self.assertTrue(claim.is_completed())
        self.assertFalse(claim.is_deleted())
        self.assertFalse(claim.is_resolved())

        headers = self.csrf_headers(client)
        response = client.delete(
            f"/api/cancel-claim/{claim.uuid}/",
            content_type=JSON,
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
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/partial-claim/"
        headers = self.csrf_headers(csrf_client)
        response = csrf_client.get(url, content_type=JSON, **headers)
        logger.debug("🚀 {}".format(response.json()))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["claim"], payload)

    def test_completed_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/completed-claim/"
        headers = self.csrf_headers(csrf_client)

        # GET completed claim (we don't have one yet)
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 404)

        # POST to create
        payload = self.base_claim(
            id=None,
            claimant_id=claimant.idp_user_xid,
            email=csrf_client.session["whoami"]["email"],
            swa_code=swa.code,
        )
        response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
        response = csrf_client.get(url, content_type=JSON, **headers)
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
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 200)
        claim_response = response.json()
        self.assertEqual(claim_response["id"], completed_claim_uuid)

        # only GET or POST allowed
        response = csrf_client.put(url, content_type=JSON, data={}, **headers)
        self.assertEqual(response.status_code, 405)

        # missing param returns error
        response = csrf_client.post(url, content_type=JSON, data={}, **headers)
        self.assertEqual(response.status_code, 400)

        # invalid claim payload returns error
        invalid_payload = {
            "claimant_id": claimant.idp_user_xid,
            "swa_code": swa.code,
            "birthdate": "1234",
            "is_complete": True,
        }
        response = csrf_client.post(
            url, content_type=JSON, data=invalid_payload, **headers
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
            response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
            url, content_type=JSON, data=invalid_payload, **headers
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
            url, content_type=JSON, data=invalid_payload, **headers
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
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/partial-claim/"
        headers = self.csrf_headers(csrf_client)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        self.write_partial_claim_payload(claim, {"id": str(claim.uuid)})
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 404)

    @override_settings(DELETE_PARTIAL_CLAIM_AFTER_DAYS=1)
    def test_partial_claim_expires_tomorrow(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/partial-claim/"
        headers = self.csrf_headers(csrf_client)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        self.write_partial_claim_payload(claim, {"id": str(claim.uuid)})
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["remaining_time"], "23:59:59")
        self.assertEqual(
            response.json()["expires"],
            str((claim.should_be_deleted_after() - timedelta(days=1)).date()),
        )

    def test_partial_claim_not_found(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/partial-claim/"
        headers = self.csrf_headers(csrf_client)

        # GET claim with no saved artifact
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        # mock up the session with the claim we just created
        session = csrf_client.session
        session["whoami"]["claim_id"] = str(claim.uuid)
        session.save()
        logger.debug("🚀🚀 expect to find no artifact for claim {}".format(claim.uuid))
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 404)

    def test_partial_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client(claimant, swa, trigger_cookie=True)
        url = "/api/partial-claim/"
        headers = self.csrf_headers(csrf_client)

        # does a partial claim already exist?
        # verify bootstrapping happens, as after an initial login.
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 200)

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
        response = csrf_client.post(url, content_type=JSON, data=payload, **headers)
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
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["claim"]["id"], str(claim.uuid))
        self.assertEqual(response_payload["status"], "ok")
        self.assertTrue(response_payload["remaining_time"])
        self.assertTrue(response_payload["expires"])
        self.assertTrue("validation_errors" in response.json())

        # GET partial claim, uncached
        session = csrf_client.session
        del session["partial_claim"]
        session.save()
        response = csrf_client.get(url, content_type=JSON, **headers)
        self.assertEqual(response.status_code, 200)
        response_payload = response.json()
        self.assertEqual(response_payload["claim"]["id"], str(claim.uuid))
        self.assertEqual(response_payload["status"], "ok")
        self.assertTrue(response_payload["remaining_time"])
        self.assertTrue(response_payload["expires"])
        self.assertTrue("validation_errors" in response.json())

        # only GET or POST allowed
        response = csrf_client.put(url, content_type=JSON, data={}, **headers)
        self.assertEqual(response.status_code, 405)

        # missing param returns error
        response = csrf_client.post(url, content_type=JSON, data={}, **headers)
        self.assertEqual(response.status_code, 400)

        # signal is_complete not isn't
        payload_that_lies = {
            "swa_code": swa.code,
            "claimant_id": claimant.idp_user_xid,
            "is_complete": True,
        }
        response = csrf_client.post(
            url, content_type=JSON, data=payload_that_lies, **headers
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
            url, content_type=JSON, data=invalid_payload, **headers
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
                content_type=JSON,
                data=payload_with_trouble,
                **headers,
            )
            logger.debug("🚀 expect error")
            self.assertEqual(response.status_code, 500)
            self.assertEqual(
                response.json(), {"status": "error", "error": "unable to save claim"}
            )

    def test_login(self):
        swa, _ = create_swa(is_active=True)
        self.assertFalse("authenticated" in self.client.session)
        response = self.client.post(
            "/api/login/",
            {
                "email": "someone@example.com",
                "IAL": "1",
                "swa_code": swa.code,
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["authenticated"])

    def test_login_json(self):
        swa, _ = create_swa(is_active=True)
        self.assertFalse("authenticated" in self.client.session)
        response = self.client.post(
            "/api/login/",
            data={"email": "someone@example.com", "IAL": "1", "swa_code": swa.code},
            content_type=JSON,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(self.client.session["authenticated"])

    def test_logout(self):
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie

        session_key = csrf_client.session.session_key
        self.assertTrue(csrf_client.session.exists(session_key))

        headers = self.csrf_headers(csrf_client)
        response = csrf_client.post(
            "/api/logout/",
            content_type=JSON,
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
        request = RequestFactory().post("/api/claim/", content_type=JSON, data=body)
        request.session = self.client.session
        claim_request = ClaimRequest(request)
        return claim_request

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
