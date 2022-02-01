# -*- coding: utf-8 -*-
from django.apps import AppConfig
import ldclient
from django.conf import settings
from ldclient.integrations import Files
from ldclient.config import Config
import os


class LaunchdarklyConfig(AppConfig):
    name = "launchdarkly"

    def ready(self):
        if os.path.exists(settings.BASE_DIR / "core" / "ld-config.json"):
            data_source = Files.new_data_source(
                paths=[settings.BASE_DIR / "core" / "ld-config.json"],
                auto_update=True,
            )
            config = Config(
                update_processor_class=data_source,
                sdk_key=settings.LD_SDK_KEY,
                send_events=False,
            )
            ldclient.set_config(config)
        else:
            ldclient.set_config(Config(sdk_key=settings.LD_SDK_KEY))
