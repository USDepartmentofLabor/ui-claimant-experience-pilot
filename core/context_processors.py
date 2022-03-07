# -*- coding: utf-8 -*-
from django.conf import settings
import logging


logger = logging.getLogger(__name__)


def base_url(request):  # pragma: no cover
    if settings.BASE_URL:
        return {"base_url": settings.BASE_URL}
    return {"base_url": f"{request.scheme}://{request.get_host()}"}
