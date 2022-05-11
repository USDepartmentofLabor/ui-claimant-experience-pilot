# -*- coding: utf-8 -*-
from django.test import TestCase, Client
from django.core import mail
from core.email import Email
import logging
from unittest.mock import patch, MagicMock


logger = logging.getLogger(__name__)


class CoreTestCase(TestCase):
    def setUp(self):
        # Empty the test outbox
        mail.outbox = []

    def test_claimant_page(self):
        response = self.client.get("/claimant/")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)

        response = self.client.get("/claimant/?swa=foo")
        self.assertContains(response, "Unemployment Insurance Claim", status_code=200)
        self.assertEqual(self.client.session.get("swa"), "foo")

    def test_email(self):
        to = "fake@example.com"
        Email(to=to, subject="test", body="hello world").send()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "test")

    def test_404(self):
        resp = self.client.get("/route-that-does-not-exist")
        self.assertContains(resp, "Page not found", status_code=404)

    def test_500(self):
        c = Client(raise_request_exception=False)
        resp = c.get("/500/")
        self.assertContains(resp, "Sorry, we had a problem", status_code=500)

    @patch("core.views.celery_app.control")
    def test_live_ok(self, patched_celery_app):
        mocked_inspect = MagicMock()
        mocked_active = MagicMock()
        patched_celery_app.inspect.return_value = mocked_inspect
        mocked_inspect.active.return_value = mocked_active
        mocked_active.keys.return_value = ["worker1", "worker2", "worker3"]
        response = self.client.get("/live/")
        self.assertEqual(response.status_code, 200)

    @patch("core.views.celery_app.control")
    def test_live_zero_celery_workers(self, patched_celery_app):
        mocked_inspect = MagicMock()
        mocked_active = MagicMock()
        patched_celery_app.inspect.return_value = mocked_inspect
        mocked_inspect.active.return_value = mocked_active
        mocked_active.keys.return_value = []
        with self.assertLogs("core", level="INFO") as cm:
            response = self.client.get("/live/")
            self.assertIn('"db": true', cm.output[0])
            self.assertIn('"redis": true', cm.output[0])
            self.assertIn('"celery": 0', cm.output[0])
            self.assertEqual(response.status_code, 503)

    @patch("core.views.celery_app.control")
    @patch("core.views.connection")
    def test_live_db_unreachable(self, patched_db_connection, patched_celery_app):
        mocked_inspect = MagicMock()
        mocked_active = MagicMock()
        patched_celery_app.inspect.return_value = mocked_inspect
        mocked_inspect.active.return_value = mocked_active
        mocked_active.keys.return_value = ["worker1", "worker2", "worker3"]

        patched_db_connection.is_usable.return_value = False
        with self.assertLogs("core", level="INFO") as cm:
            response = self.client.get("/live/")
            self.assertIn('"db": false', cm.output[0])
            self.assertIn('"redis": true', cm.output[0])
            self.assertIn('"celery": 3', cm.output[0])
            self.assertEqual(response.status_code, 503)

    @patch("core.views.celery_app.control")
    @patch("core.views.cache")
    def test_live_redis_unreachable(self, patched_redis_cache, patched_celery_app):
        mocked_inspect = MagicMock()
        mocked_active = MagicMock()
        patched_celery_app.inspect.return_value = mocked_inspect
        mocked_inspect.active.return_value = mocked_active
        mocked_active.keys.return_value = ["worker1", "worker2", "worker3"]

        cache_client = MagicMock()
        patched_redis_cache.client.get_client.return_value = cache_client
        cache_client.ping.return_value = False
        with self.assertLogs("core", level="INFO") as cm:
            response = self.client.get("/live/")
            self.assertIn('"db": true', cm.output[0])
            self.assertIn('"redis": false', cm.output[0])
            self.assertIn('"celery": 3', cm.output[0])
            self.assertEqual(response.status_code, 503)
