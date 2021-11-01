# -*- coding: utf-8 -*-
from django.test import TransactionTestCase
from celery.contrib.testing.worker import start_worker
from core.celery import app as celery_app
from core import tasks
import contextlib
import io
import time
import logging


logger = logging.getLogger("tasks_tests")


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

    def wait_for_workers_to_finish(self):
        status = self.get_celery_worker_status()
        tries = 0
        while status["queued"] != 0:  # pragma: no cover
            tries += 1
            if tries > 10:
                break
            logger.debug("[{}] waiting for Celery to finish...".format(tries))
            time.sleep(1)
            status = self.get_celery_worker_status()
        return tries

    def get_celery_worker_status(self):
        insp = celery_app.control.inspect()
        availability = insp.ping()
        stats = insp.stats()
        registered_tasks = insp.registered()
        active_tasks = insp.active()
        scheduled_tasks = insp.scheduled()
        queued = 0
        for host, task_list in scheduled_tasks.items():
            queued += len(task_list)
        result = {
            "availability": availability,
            "stats": stats,
            "registered_tasks": registered_tasks,
            "active_tasks": active_tasks,
            "scheduled_tasks": scheduled_tasks,
            "queued": queued,
        }
        return result


class CoreTasksTestCase(CeleryTestCase):
    def test_multiply(self):
        self.assertEqual(multiply.delay(4, 4).get(timeout=10), 16)

    def test_hello(self):
        with io.StringIO() as buf:
            with contextlib.redirect_stdout(buf):
                tasks.hello.delay().get(timeout=10)
            self.assertEqual(buf.getvalue(), "Hello there!\n")
