# -*- coding: utf-8 -*-
from django.conf import settings
import logging
from launchdarkly.client import ld_client

logger = logging.getLogger(__name__)


def base_url(request):  # pragma: no cover
    base_url = (
        settings.BASE_URL
        if settings.BASE_URL
        else f"{request.scheme}://{request.get_host()}"
    )
    return {
        "base_url": base_url,
        "current_path": request.path,
        "appname": "Unemployment.dol.gov",
    }


# initialize common vars to None to sidestep VariableDoesNotExist
# errors, even when the vars are not used.
def common_vars(request):
    params = {
        "pattern": None,
        "swa": None,
        "whoami": None,
        "required": None,
        "onchange": None,
        "disabled": None,
        "show_navigation": False,
        "contact_us_path": None,
        "home_path": "/",
        "show_test_banner": settings.DISPLAY_TEST_SITE_BANNER,
    }
    return params


def ld_flags(request):
    return {
        "system_admin_message": ld_client.variation(
            "system-admin-message", {"key": "anonymous-user"}, ""
        ),
        "system_admin_message_type": ld_client.variation(
            "system-admin-message-type", {"key": "anonymous-user"}, "info"
        ),
    }
