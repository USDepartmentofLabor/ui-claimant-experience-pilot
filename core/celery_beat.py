# -*- coding: utf-8 -*-
from django_celery_beat.models import PeriodicTask, IntervalSchedule

schedule, _ = IntervalSchedule.objects.get_or_create(
    every=1,
    period=IntervalSchedule.DAYS,
)

PeriodicTask.objects.create(
    interval=schedule,
    name="Deleting expired partial claims",
    task="core.tasks.delete_partial_claims",
)
