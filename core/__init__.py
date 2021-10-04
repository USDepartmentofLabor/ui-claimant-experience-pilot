# -*- coding: utf-8 -*-
from . import tasks
from .celery import app as celery_app

__all__ = [
    "tasks",
    "celery_app",
]
