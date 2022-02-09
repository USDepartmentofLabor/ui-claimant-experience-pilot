# -*- coding: utf-8 -*-
from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task
def hello():
    print("Hello there!")


@shared_task
def fail():  # pragma: no cover
    raise Exception("failure!")


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={"max_retries": 2},
)
def fail_and_retry(self):  # pragma: no cover
    raise Exception("failure! but we'll try again as {}".format(self))


@shared_task
def delete_partial_claims():
    from api.models import Claim
    from api.models.claim import SUCCESS

    claims = Claim.expired_partial_claims.all()

    count = 0
    for c in claims:
        status = c.delete_artifacts()
        if status == SUCCESS:
            count += 1
    logger.info(f"Total expired partial claims deleted: {count}")
    return count
