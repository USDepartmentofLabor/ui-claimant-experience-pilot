# -*- coding: utf-8 -*-
from django.test import TransactionTestCase
from celery.contrib.testing.worker import start_worker
from core.celery import app as celery_app
from core import tasks
import contextlib
import io


@celery_app.task
def multiply(x, y):
    return x * y


class CeleryTestCase(TransactionTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()

        # Start up celery worker
        cls.celery_worker = start_worker(
            app=celery_app, loglevel="debug", perform_ping_check=False
        )
        cls.celery_worker.__enter__()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()

        # Close worker
        cls.celery_worker.__exit__(None, None, None)


class CoreTasksTestCase(CeleryTestCase):
    def test_multiply(self):
        self.assertEqual(multiply.delay(4, 4).get(timeout=10), 16)

    def test_hello(self):
        with io.StringIO() as buf:
            with contextlib.redirect_stdout(buf):
                tasks.hello.delay().get(timeout=10)
            self.assertEqual(buf.getvalue(), "Hello there!\n")
