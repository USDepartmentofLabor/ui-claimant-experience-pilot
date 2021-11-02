# -*- coding: utf-8 -*-
from django.test import Client, RequestFactory
from django.core import mail
from unittest.mock import patch
import boto3
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
import uuid


class ApiTestCase(CeleryTestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def verify_session(self, client=None):
        client = client if client else self.client
        session = client.session
        session["verified"] = True
        session["whoami"] = {"hello": "world", "email": "someone@example.com"}
        session.save()
        return session

    def csrf_client(self):
        # by default self.client relaxes the CSRF check, so we create our own client to test.
        c = Client(enforce_csrf_checks=True)
        self.verify_session(c)
        return c

    def test_whoami(self):
        self.verify_session()
        response = self.client.get("/api/whoami/")
        whoami = response.json()
        self.assertEqual(whoami["hello"], "world")
        self.assertIsInstance(whoami["form_id"], str)
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
            "/api/claim/", content_type="application/json", data={}
        )
        self.assertEqual(response.status_code, 403)

    def test_claim_with_csrf(self):
        idp = create_idp()
        swa, _ = create_swa()
        claimant = create_claimant(idp)
        csrf_client = self.csrf_client()
        csrf_client.get("/api/whoami/").json()  # trigger csrftoken cookie
        url = "/api/claim/"
        payload = {"claimant_id": claimant.idp_user_xid, "swa_code": swa.code}
        headers = {"HTTP_X_CSRFTOKEN": csrf_client.cookies["csrftoken"].value}
        response = csrf_client.post(
            url, content_type="application/json", data=payload, **headers
        )
        self.assertEqual(response.status_code, 202)
        claim = claimant.claim_set.all()[0]
        self.assertEqual(
            response.json(), {"status": "accepted", "claim_id": str(claim.uuid)}
        )

        # this requires celery task to run to completion async,
        # so wait a little
        self.wait_for_workers_to_finish()
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "hello world")

        # only POST allowed
        response = csrf_client.get(url)
        self.assertEqual(response.status_code, 405)

        # missing param returns error
        response = csrf_client.post(
            url, content_type="application/json", data={}, **headers
        )
        self.assertEqual(response.status_code, 400)

        # failure to write claim returns error
        with patch("core.claim_storage.ClaimStore.s3_client") as mocked_client:
            client = boto3.client("s3")
            stubber = Stubber(client)
            stubber.add_client_error("put_object")
            stubber.activate()
            mocked_client.return_value = client
            response = csrf_client.post(
                url, content_type="application/json", data=payload, **headers
            )
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

    def create_api_claim_request(self, body):
        request = RequestFactory().post(
            "/api/claim", content_type="application/json", data=body
        )
        request.session = self.client.session
        claim_request = ClaimRequest(request)
        return claim_request

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
