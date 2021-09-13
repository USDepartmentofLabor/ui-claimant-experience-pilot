# -*- coding: utf-8 -*-
from django.shortcuts import render
import logging

logger = logging.getLogger("core")


def initclaim(request):
    return render(None, "build/index.html")
