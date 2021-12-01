# -*- coding: utf-8 -*-
from celery import shared_task


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
