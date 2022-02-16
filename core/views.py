# -*- coding: utf-8 -*-
from django.shortcuts import render
from django.views.decorators.cache import never_cache
import logging
import time
from home.views import base_url
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.core.exceptions import ObjectDoesNotExist

from . import settings
from .celery import app as celery_app


logger = logging.getLogger("core")


# for testing 500 handling
@never_cache
def raise_error(request):
    raise ObjectDoesNotExist("Something went wrong")


def claimant(request):
    # remember specific swa if mentioned
    if "swa" in request.GET:
        request.session["swa"] = request.GET["swa"]

    return render(
        None,
        "build/index.html",
        {
            "LD_CLIENT_SDK_KEY": settings.LD_CLIENT_SDK_KEY,
            "base_url": base_url(request),
        },
    )


@never_cache
def live(request):
    try:
        db_start = time.time()
        connection.ensure_connection()
        db_ok = connection.is_usable()
        db_response_time = time.time() - db_start
    except Exception as err:  # pragma: no cover
        logger.exception(err)
        db_ok = False
        db_response_time = 0
    redis_start = time.time()
    redis_ok = cache.client.get_client().ping()
    redis_response_time = time.time() - redis_start
    celery_workers = celery_app.control.inspect().active()
    celery_worker_count = len(celery_workers.keys()) if celery_workers else 0
    status = 200 if redis_ok and db_ok and celery_worker_count > 0 else 503
    return JsonResponse(
        {
            "db": db_ok,
            "db_response": "{:.3f}".format(db_response_time),
            "redis": redis_ok,
            "redis_response": "{:.3f}".format(redis_response_time),
            "celery": celery_worker_count,
        },
        status=status,
    )
