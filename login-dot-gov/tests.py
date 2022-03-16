# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from unittest.mock import patch, MagicMock
from logindotgov.mock_server import OIDC as MockServer
from logindotgov.oidc import LoginDotGovOIDCClient
from urllib.parse import urlparse, parse_qsl
from django.test.utils import override_settings
from django.conf import settings
from api.test_utils import create_swa, create_whoami
from api.models import IdentityProvider, Claimant, Claim, SWA
from core.test_utils import create_s3_bucket, delete_s3_bucket
import logging
import uuid

logger = logging.getLogger(__name__)

# set up the mock OIDC server
MockServer.register_client(
    settings.LOGIN_DOT_GOV_CLIENT_ID,
    settings.LOGIN_DOT_GOV_PUBLIC_KEY,
    settings.LOGIN_DOT_GOV_REDIRECT_URI,
)
MockServer.register_client(
    f"{settings.LOGIN_DOT_GOV_CLIENT_ID}:verified:false",
    settings.LOGIN_DOT_GOV_PUBLIC_KEY,
    settings.LOGIN_DOT_GOV_REDIRECT_URI,
)


def mocked_logindotdov_oidc_server(*args, **kwargs):
    server = MockServer()
    return server.route_request(args, kwargs)


def mimic_oidc_server_authorized(url):
    login_uri_parsed = urlparse(url)
    login_query = dict(parse_qsl(login_uri_parsed.query))
    authorize_response = MockServer.authorize_endpoint(login_query)
    authorize_parsed = urlparse(authorize_response.json_data)
    return authorize_parsed


@patch(
    "logindotgov.oidc.requests.get",
    new=MagicMock(side_effect=mocked_logindotdov_oidc_server),
)
@patch(
    "logindotgov.oidc.requests.post",
    new=MagicMock(side_effect=mocked_logindotdov_oidc_server),
)
class LoginDotGovTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        IdentityProvider.objects.get_or_create(name="login.gov")
        create_s3_bucket()
        create_s3_bucket(is_archive=True)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()
        delete_s3_bucket(is_archive=True)

    @override_settings(DEBUG=True)  # so that /explain works
    def test_oidc_flow(self):
        swa, _ = create_swa(is_active=True)
        # swa= or swa_code= will both work
        response = self.client.get(f"/logindotgov/?swa_code={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)
        self.assertEquals(self.client.session["swa"], swa.code)

        self.client.session.flush()

        response = self.client.get(f"/logindotgov/?swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)
        self.assertEquals(self.client.session["swa"], swa.code)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        # the mock server should try to step up to IAL2
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        logger.debug("🚀 response.url {}".format(response.url))
        self.assertEquals(response.status_code, 302)
        self.assertEquals(response.url, "/logindotgov/?ial=2")

        response = self.client.get(response.url)
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/claimant/", status_code=302)

        claimant = Claimant.objects.last()
        self.assertEquals(claimant.last_login_event().description, "2")
        self.assertEquals(
            claimant.last_login_event().category, Claimant.EventCategories.LOGGED_IN
        )
        self.assertEquals(claimant.IAL, 2)

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        logger.debug("🚀 whoami={}".format(whoami))
        self.assertEquals(explained["authenticated"], True)
        self.assertEquals(whoami["email"], "you@example.gov")
        self.assertEquals(whoami["IAL"], "2")
        self.assertTrue(whoami["first_name"])
        self.assertTrue(whoami["last_name"])
        self.assertTrue(whoami["ssn"])
        self.assertTrue(whoami["birthdate"])
        self.assertTrue(whoami["phone"])
        self.assertEquals(
            whoami["address"],
            {
                "address1": "1600 Pennsylvania Ave",
                "address2": "Oval Office",
                "city": "Washington",
                "state": "DC",
                "zipcode": "20500",
            },
        )

    @override_settings(DEBUG=True)  # so that /explain works
    @patch(
        "login-dot-gov.views.logindotgov_client",
    )
    def test_ial1_unverified(self, patched_client):
        patched_client.return_value = LoginDotGovOIDCClient(
            client_id=f"{settings.LOGIN_DOT_GOV_CLIENT_ID}:verified:false",
            private_key=settings.LOGIN_DOT_GOV_PRIVATE_KEY,
            logger=logger,
        )
        swa, _ = create_swa(is_active=True)
        # default IAL1
        response = self.client.get(f"/logindotgov/?ial=0&swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)

        response = self.client.get(f"/logindotgov/?ial=1&swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/claimant/", status_code=302)

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        self.assertEquals(explained["authenticated"], True)
        self.assertEquals(whoami["email"], "you@example.gov")
        self.assertEquals(whoami["IAL"], "1")
        self.assertFalse(whoami["first_name"])
        self.assertFalse(whoami["last_name"])
        self.assertFalse(whoami["ssn"])
        self.assertFalse(whoami["birthdate"])
        self.assertFalse(whoami["phone"])

        # logging in again at IAL2 will create step up event
        response = self.client.get(f"/logindotgov/?ial=2&swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 2)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/claimant/", status_code=302)

        claimant = Claimant.objects.get(
            idp_user_xid=self.client.session["whoami"]["claimant_id"]
        )
        self.assertEquals(claimant.events.last().category, Claimant.EventCategories.IAL)
        self.assertEquals(claimant.events.last().description, "1 => 2")

    @override_settings(DEBUG=True)  # so that /explain works
    def test_ial1_verified(self):
        swa, _ = create_swa(is_active=True)

        response = self.client.get(f"/logindotgov/?ial=1&swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response,
            "/logindotgov/?ial=2",
            status_code=302,
            fetch_redirect_response=False,
        )

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        # we redirected immediately to "step up" so we are not yet finished authenticating.
        self.assertTrue("authenticated" not in explained)
        self.assertEquals(whoami["email"], "you@example.gov")
        # the MockServer will return a verified_at value so that triggers "2"
        self.assertEquals(whoami["IAL"], "2")
        self.assertFalse(whoami["first_name"])
        self.assertFalse(whoami["last_name"])
        self.assertFalse(whoami["ssn"])
        self.assertFalse(whoami["birthdate"])
        self.assertFalse(whoami["phone"])

    def test_session_authenticated(self):
        session = self.client.session
        session["authenticated"] = True
        session["whoami"] = create_whoami()
        session["swa"] = session["whoami"]["swa"]["code"]
        session.save()

        response = self.client.get("/logindotgov/")
        self.assertRedirects(
            response,
            "/claimant/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_explain(self):
        response = self.client.get("/logindotgov/explain")
        self.assertEqual(response.status_code, 401)

    def test_oidc_restart_when_no_session_found(self):
        response = self.client.get("/logindotgov/result?state=fake&code=fake")
        self.assertRedirects(
            response,
            "/logindotgov/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_oidc_stash_session_state(self):
        # session expires
        swa, _ = create_swa(is_active=True)
        response = self.client.get(f"/logindotgov/?ial=1&swa={swa.code}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        session = self.client.session
        session.flush()
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response,
            f"/logindotgov/?ial=1&swa={swa.code}",
            status_code=302,
            fetch_redirect_response=False,
        )

        session.flush()

        # session expires with swa_xid
        response = self.client.get(f"/logindotgov/?ial=1&swa={swa.code}&swa_xid=abc")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        session = self.client.session
        session.flush()
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response,
            f"/logindotgov/?ial=1&swa={swa.code}&swa_xid=abc",
            status_code=302,
            fetch_redirect_response=False,
        )

        session.flush()

        # session active but different browser
        # use ial=2 to avoid automatic step up
        client_one = Client()
        client_two = Client()
        response = client_one.get(f"/logindotgov/?ial=2&swa={swa.code}&swa_xid=abc")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        logger.debug(
            "⚡️ client_one session key {}".format(client_one.session.session_key)
        )
        with self.assertLogs(level="DEBUG") as cm:
            response = client_two.get(f"/logindotgov/result?{authorize_parsed.query}")
            self.assertIn(
                "DEBUG:logindotgov:🚀 found existing active session",
                cm.output,
            )
        self.assertRedirects(response, "/claimant/", status_code=302)

    def test_oidc_errors(self):
        # missing swa is 404 error
        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 404)

        # invalid swa is 404 not found
        response = self.client.get("/logindotgov/?swa=XX")
        self.assertEquals(response.status_code, 404)

        swa, _ = create_swa(is_active=True)
        response = self.client.get(f"/logindotgov/?swa={swa.code}")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        authorize_params = dict(parse_qsl(authorize_parsed.query))

        # missing state or code
        response = self.client.get("/logindotgov/result?code=foo123")
        self.assertContains(response, "Missing state param", status_code=403)
        response = self.client.get("/logindotgov/result?state=foo123")
        self.assertContains(response, "Missing code param", status_code=403)

        # state does not match
        response = self.client.get(
            f"/logindotgov/result?state=wrong&code={authorize_params['code']}"
        )
        self.assertContains(response, "state mismatch", status_code=403)

        # bad code
        response = self.client.get(
            f"/logindotgov/result?code=wrong&state={authorize_params['state']}"
        )
        self.assertContains(response, "missing access_token", status_code=403)

        # the nonce we sent initially changes
        session = self.client.session
        session["logindotgov"]["nonce"] = "changed"
        session.save()
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertContains(response, "Error exchanging token", status_code=403)

        # ial missing from session
        session = self.client.session
        del session["IAL"]
        session.save()
        response = self.client.get("/logindotgov/result?code=fake&state=fake")
        self.assertRedirects(
            response, "/logindotgov/", status_code=302, fetch_redirect_response=False
        )

    def test_redirect_to(self):
        swa, _ = create_swa(is_active=True)
        session = self.client.session
        session["redirect_to"] = "/some/place/else"
        session.save()

        response = self.client.get(f"/logindotgov/?ial=2&swa={swa.code}")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response, "/some/place/else", status_code=302, fetch_redirect_response=False
        )

    def test_ial2_step_up(self):
        # existing session at IAL1, request to step up to IAL2
        session = self.client.session
        session["authenticated"] = True
        session["whoami"] = create_whoami() | {"IAL": "1"}
        session.save()
        swa, _ = create_swa(is_active=True)
        response = self.client.get(f"/logindotgov/?swa={swa.code}&ial=2")
        self.assertTrue("login" in response.url)
        self.assertEquals(response.status_code, 302)
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response, "/claimant/", status_code=302, fetch_redirect_response=False
        )
        self.assertEqual(self.client.session["whoami"]["IAL"], "2")

    # this is the "escape" url from login.gov where users can opt-out of proofing
    def test_ial2required(self):
        response = self.client.get("/logindotgov/ial2required")
        self.assertContains(response, "Login failed", status_code=403)

        session = self.client.session
        session["authenticated"] = True
        session["whoami"] = create_whoami() | {"IAL": "1"}
        session["whoami"]["swa"]["featureset"] = "Identity Only"
        session.save()
        response = self.client.get("/logindotgov/ial2required")
        self.assertRedirects(
            response,
            "/identity/?ial2error=true&idp=logindotgov",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_swa_selection(self):
        swa, _ = create_swa(is_active=True)
        response = self.client.get(f"/logindotgov/?swa={swa.code}")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["swa"], swa.code)

    def test_swa_xid_preserved(self):
        swa, _ = create_swa(is_active=True)
        swa_xid = str(uuid.uuid4())
        response = self.client.get(f"/logindotgov/?swa={swa.code}&swa_xid={swa_xid}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertEquals(claim.swa_xid, swa_xid)
        self.assertEquals(claim.swa, swa)
        self.assertTrue(claim.is_initiated_with_swa_xid())

        # logging in again with same swa_xid param in URL re-uses same Claim
        self.client.session.flush()
        response = self.client.get(f"/logindotgov/?swa={swa.code}&swa_xid={swa_xid}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        self.assertEqual(claimant.claim_set.count(), 1)
        claim = claimant.claim_set.last()
        self.assertEquals(claim.swa_xid, swa_xid)
        self.assertEquals(claim.swa, swa)
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.INITIATED_WITH_SWA_XID
            ).count(),
            2,
        )

    def test_swa_xid_preserved_with_cookie(self):
        swa, _ = create_swa(is_active=True)
        swa_xid = str(uuid.uuid4())
        self.client.cookies["swa_xid"] = swa_xid
        response = self.client.get(f"/logindotgov/?swa={swa.code}&swa_xid={swa_xid}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertEquals(claim.swa_xid, swa_xid)
        self.assertEquals(claim.swa, swa)
        self.assertTrue(claim.is_initiated_with_swa_xid())

        # logging in again with same browser uses same Claim
        self.client.session.flush()
        response = self.client.get(f"/logindotgov/?swa={swa.code}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEqual(swa_xid, self.client.session.get("swa_xid"))
        claimant = Claimant.objects.last()
        self.assertEqual(claimant.claim_set.count(), 1)
        claim = claimant.claim_set.last()
        self.assertEquals(claim.swa_xid, swa_xid)
        self.assertEquals(claim.swa, swa)
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.INITIATED_WITH_SWA_XID
            ).count(),
            2,
        )

    def test_swa_xid_duplicate_error(self):
        swa, _ = create_swa(is_active=True)
        swa2, _ = create_swa(is_active=True, code="XX")
        swa_xid = str(uuid.uuid4())
        response = self.client.get(f"/logindotgov/?swa={swa.code}&swa_xid={swa_xid}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertEquals(claim.swa_xid, swa_xid)
        self.assertEquals(claim.swa, swa)
        self.assertTrue(claim.is_initiated_with_swa_xid())
        # different SWA should raise error
        client_shows_error = Client(raise_request_exception=False)
        response = client_shows_error.get(
            f"/logindotgov/?swa={swa2.code}&swa_xid={swa_xid}"
        )
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = client_shows_error.get(
            f"/logindotgov/result?{authorize_parsed.query}"
        )
        self.assertContains(
            response, f"already exists for SWA {swa.code}", status_code=500
        )

    def test_identity_only_claim_same_session(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )

        # swa_xid param required for identity only swa
        response = self.client.get(f"/logindotgov/?ial=1&swa={swa.code}")
        self.assertContains(response, "Page not found", status_code=400)

        swa_xid = str(uuid.uuid4())
        response = self.client.get(
            f"/logindotgov/?ial=1&swa={swa.code}&swa_xid={swa_xid}"
        )
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertTrue(claim.is_initiated_with_swa_xid())
        self.assertFalse(claim.is_completed())

        # step up should complete the claim
        response = self.client.get("/logindotgov/?ial=2")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertTrue(claim.is_initiated_with_swa_xid())
        self.assertTrue(claim.is_completed())

    def test_identity_only_claim_different_session(self):
        swa, _ = create_swa(
            is_active=True, featureset=SWA.FeatureSetOptions.IDENTITY_ONLY
        )
        swa_xid = str(uuid.uuid4())
        response = self.client.get(
            f"/logindotgov/?ial=1&swa={swa.code}&swa_xid={swa_xid}"
        )
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertEquals(self.client.session["swa_xid"], swa_xid)
        claimant = Claimant.objects.last()
        claim = claimant.claim_set.last()
        self.assertTrue(claim.is_initiated_with_swa_xid())
        self.assertFalse(claim.is_completed())

        self.client.session.flush()

        # step up should complete the claim
        response = self.client.get(f"/logindotgov/?ial=2&swa={swa.code}")
        authorize_parsed = mimic_oidc_server_authorized(response.url)
        self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertTrue(claim.is_initiated_with_swa_xid())
        self.assertTrue(claim.is_completed())
