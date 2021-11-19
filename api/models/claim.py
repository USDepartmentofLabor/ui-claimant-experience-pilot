# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .swa import SWA
from .claimant import Claimant
from .event import Event
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
import uuid


class Claim(TimeStampedModel):
    class Meta:
        db_table = "claims"

    class EventCategories(models.IntegerChoices):
        STARTED = 1
        SUBMITTED = 2
        COMPLETED = 3
        FETCHED = 4
        STORED = 5
        CONFIRMATION_EMAIL = 6
        DELETED = 7

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    swa = models.ForeignKey(SWA, on_delete=models.PROTECT)
    claimant = models.ForeignKey(Claimant, on_delete=models.PROTECT)
    status = models.CharField(max_length=255, null=True)
    events = GenericRelation(
        Event, content_type_field="model_name", object_id_field="model_id"
    )

    def payload_path(self):
        if self.is_complete():
            return self.completed_payload_path()
        else:
            return self.partial_payload_path()

    def completed_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.json"

    def partial_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.partial.json"

    def is_complete(self):
        return True  # TODO use events to determine

    def public_events(self):
        return list(map(lambda event: event.as_public_dict(), self.events.all()))
