# -*- coding: utf-8 -*-
from celery.contrib.testing.worker import start_worker
from core.celery import app as celery_app
from core import tasks
import contextlib
import io
import time

from django.test import TransactionTestCase
from django.conf import settings
from api.models import Claim
from core.claim_storage import ClaimStore

from api.test_utils import create_swa, create_idp, build_claim_updated_by_event
import logging
from core.test_utils import (
    create_s3_bucket,
    delete_s3_bucket,
)


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
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def test_multiply(self):
        self.assertEqual(multiply.delay(4, 4).get(timeout=10), 16)

    def test_hello(self):
        with io.StringIO() as buf:
            with contextlib.redirect_stdout(buf):
                tasks.hello.delay().get(timeout=10)
            self.assertEqual(buf.getvalue(), "Hello there!\n")

    def test_delete_partial_claims(self):
        claim_lifespan = settings.DELETE_PARTIAL_CLAIM_AFTER_DAYS
        swa, _ = create_swa()
        idp = create_idp()

        expired_claim_uuid = "0a5cf608-0c72-4d37-8695-85497ad53d34"
        test_data_cases = [
            {
                "idp_user_xid": 1,
                "uuid": expired_claim_uuid,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 1,
                    }
                ],
            },
            {
                "idp_user_xid": 2,
                "uuid": "8632c3bc-00f3-493b-beb0-f1406f4faf79",
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 2,
                    }
                ],
            },
            {
                "idp_user_xid": 3,
                "uuid": "b2edb136-d166-4e28-8e83-b0ea48eef7e0",
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 3,
                    },
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 2,
                    },
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 4,
                    },
                ],
            },
            {
                "idp_user_xid": 4,
                "uuid": "9656b523-151e-482d-9c4b-2aec21764547",
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 3,
                    }
                ],
            },
        ]

        for case in test_data_cases:
            claim = build_claim_updated_by_event(
                idp=idp,
                swa=swa,
                idp_user_xid=case["idp_user_xid"],
                uuid=case["uuid"],
                events=case["events"],
            )
            claim_store = ClaimStore()
            claim_store.write(claim.partial_payload_path(), "test")

        count = tasks.delete_partial_claims()
        self.assertEqual(count, 2)
