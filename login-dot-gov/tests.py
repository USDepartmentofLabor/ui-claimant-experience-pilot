# -*- coding: utf-8 -*-
from django.test import TestCase
from unittest.mock import patch, MagicMock
from logindotgov.mock_server import OIDC as MockServer
from urllib.parse import urlparse, parse_qsl
from django.test.utils import override_settings
from django.conf import settings
from api.models import IdentityProvider, Claimant
import logging

logger = logging.getLogger(__name__)

# set up the mock OIDC server
MockServer.register_client(
    settings.LOGIN_DOT_GOV_CLIENT_ID,
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

    @override_settings(DEBUG=True)  # so that /explain works
    def test_oidc_flow(self):
        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        # the server will redirect to here
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/claimant/", status_code=302)

        claimant = Claimant.objects.last()
        self.assertEquals(claimant.events.last().description, "2")
        self.assertEquals(
            claimant.events.last().category, Claimant.EventCategories.LOGGED_IN
        )

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        logger.debug("whoami={}".format(whoami))
        self.assertEquals(explained["verified"], True)
        self.assertEquals(whoami["email"], "you@example.gov")
        self.assertEquals(whoami["IAL"], 2)
        self.assertTrue(whoami["first_name"])
        self.assertTrue(whoami["last_name"])
        self.assertTrue(whoami["ssn"])
        self.assertTrue(whoami["birthdate"])
        self.assertTrue(whoami["phone"])
        self.assertTrue(
            whoami["address"],
            {
                "address1": "1600 Pennsylvania Ave",
                "city": "Washington",
                "state": "DC",
                "zipcode": "20500",
            },
        )

    @override_settings(DEBUG=True)  # so that /explain works
    def test_ial1(self):
        # ial == 2 unless explicitly == 1
        response = self.client.get("/logindotgov/?ial=0")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 2)

        response = self.client.get("/logindotgov/?ial=1")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["IAL"], 1)

        authorize_parsed = mimic_oidc_server_authorized(response.url)
        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(response, "/claimant/", status_code=302)

        # confirm our session looks as we expect
        response = self.client.get("/logindotgov/explain")
        explained = response.json()
        whoami = explained["whoami"]
        self.assertEquals(explained["verified"], True)
        self.assertEquals(whoami["email"], "you@example.gov")
        self.assertEquals(whoami["IAL"], 1)
        self.assertFalse(whoami["first_name"])
        self.assertFalse(whoami["last_name"])
        self.assertFalse(whoami["ssn"])
        self.assertFalse(whoami["birthdate"])
        self.assertFalse(whoami["phone"])

    def test_session_verified(self):
        session = self.client.session
        session["verified"] = True
        session.save()

        response = self.client.get("/logindotgov/")
        self.assertRedirects(response, "/claimant/", status_code=302)

    def test_explain(self):
        response = self.client.get("/logindotgov/explain")
        self.assertEqual(response.status_code, 401)

    def test_oidc_restart_when_no_session_found(self):
        response = self.client.get("/logindotgov/result")
        self.assertRedirects(
            response,
            "/logindotgov/",
            status_code=302,
            fetch_redirect_response=False,
        )

    def test_oidc_errors(self):
        response = self.client.get("/logindotgov/")
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
        response = self.client.get("/logindotgov/result")
        self.assertRedirects(
            response, "/logindotgov/", status_code=302, fetch_redirect_response=False
        )

    def test_redirect_to(self):
        session = self.client.session
        session["redirect_to"] = "/some/place/else"
        session.save()

        response = self.client.get("/logindotgov/")
        self.assertEquals(response.status_code, 302)

        authorize_parsed = mimic_oidc_server_authorized(response.url)

        response = self.client.get(f"/logindotgov/result?{authorize_parsed.query}")
        self.assertRedirects(
            response, "/some/place/else", status_code=302, fetch_redirect_response=False
        )

    # this is the "escape" url from login.gov where users can opt-out of proofing
    def test_ial2required(self):
        response = self.client.get("/logindotgov/ial2required")
        self.assertRedirects(
            response,
            "/ial2required/?idp=logindotgov",
            status_code=302,
            fetch_redirect_response=False,
        )

        session = self.client.session
        session["verified"] = True
        session.save()
        response = self.client.get("/logindotgov/ial2required")
        self.assertRedirects(
            response, "/", status_code=302, fetch_redirect_response=False
        )

    def test_swa_selection(self):
        response = self.client.get("/logindotgov/?swa=XX")
        self.assertEquals(response.status_code, 302)
        self.assertEquals(self.client.session["swa"], "XX")
