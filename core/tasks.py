# -*- coding: utf-8 -*-
from .celery import app


@app.task
def hello():
    print("Hello there!")
