# -*- coding: utf-8 -*-
import os
from celery import Celery
from celery import signals
from kombu_fernet.serializers.json import MIMETYPE


@signals.celeryd_init.connect
def setup_log_format(sender, conf, **kwargs):  # pragma: no cover
    conf.worker_log_format = """
        [celery.worker][%(asctime)s: %(levelname)s/%(processName)s {0}] %(message)s
    """.strip().format(
        sender
    )
    conf.worker_task_log_format = (
        "[celery.worker.task][%(asctime)s: %(levelname)s/%(processName)s {0}] "
        "[%(task_name)s(%(task_id)s)] %(message)s"
    ).format(sender)


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

app = Celery("core")
app.config_from_object("django.conf:settings", namespace="CELERY")
# encryption via kombu-fernet-serializers
# requires us to set this here rather than in settings.py
app.conf.update(
    CELERY_TASK_SERIALIZER="fernet_json",
    CELERY_RESULT_SERIALIZER="fernet_json",
    CELERY_ACCEPT_CONTENT=[MIMETYPE],
)
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):  # pragma: nocover
    print("Request: {0!r}".format(self.request))


if __name__ == "__main__":  # pragma: no cover
    app.start()
