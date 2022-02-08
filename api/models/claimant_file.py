# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .claimant import Claimant
from .event import Event
from .swa import SWA
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
import uuid


class ClaimantFile(TimeStampedModel):
    class Meta:
        db_table = "claimant_files"

    class EventCategories(models.IntegerChoices):
        FETCHED = 1
        STORED = 2
        DELETED = 3

    class FileTypeOptions(models.IntegerChoices):
        UNKNOWN = 0
        F1099G = 1  # F prefix since Python can't start with a number

    claimant = models.ForeignKey(Claimant, on_delete=models.CASCADE)
    fileext = models.CharField(max_length=4)
    filetype = models.IntegerField(
        choices=FileTypeOptions.choices, default=FileTypeOptions.UNKNOWN
    )
    # TODO allow corrected versions? unique constraint?
    year = models.CharField(max_length=4)
    swa = models.ForeignKey(SWA, on_delete=models.PROTECT)
    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    events = GenericRelation(
        Event, content_type_field="model_name", object_id_field="model_id"
    )

    def create_stored_event(self, bucket_name):
        return self.events.create(
            category=ClaimantFile.EventCategories.STORED, description=bucket_name
        )

    def payload_path(self):
        return f"{self.claimant.idp_user_xid}/{self.uuid}.{self.fileext}"
