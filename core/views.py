# -*- coding: utf-8 -*-
from django.shortcuts import render
import logging
from home.views import base_url

logger = logging.getLogger("core")


def claimant(request):
    return render(None, "build/index.html", {"base_url": base_url(request)})
