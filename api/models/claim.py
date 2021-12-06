# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .swa import SWA
from .claimant import Claimant
from .event import Event
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
import uuid
from django.db import transaction
from jwcrypto.common import json_encode
import logging


logger = logging.getLogger(__name__)

NOOP = -1
SUCCESS = 1
FAILURE = 0


class Claim(TimeStampedModel):
    class Meta:
        db_table = "claims"

    class EventCategories(models.IntegerChoices):
        REUSE_ME = 1
        SUBMITTED = 2
        COMPLETED = 3
        FETCHED = 4
        STORED = 5
        CONFIRMATION_EMAIL = 6
        DELETED = 7
        STATUS_CHANGED = 8

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    swa = models.ForeignKey(SWA, on_delete=models.PROTECT)
    claimant = models.ForeignKey(Claimant, on_delete=models.PROTECT)
    status = models.CharField(max_length=255, null=True)
    events = GenericRelation(
        Event, content_type_field="model_name", object_id_field="model_id"
    )

    def create_stored_event(self):
        return self.events.create(category=Claim.EventCategories.STORED)

    def payload_path(self):
        if self.is_completed():
            return self.completed_payload_path()
        else:
            return self.partial_payload_path()

    def completed_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.json"

    def partial_payload_path(self):
        return f"{self.swa.code}/{self.uuid}.partial.json"

    def change_status(self, new_status):
        with transaction.atomic():
            old_status = self.status
            self.status = new_status
            self.save()
            event_description = json_encode({"old": old_status, "new": new_status})
            self.events.create(
                category=Claim.EventCategories.STATUS_CHANGED,
                description=event_description,
            )
        return self

    def is_completed(self):
        return self.events.filter(category=Claim.EventCategories.COMPLETED).count() > 0

    def is_deleted(self):
        return self.events.filter(category=Claim.EventCategories.DELETED).count() > 0

    def public_events(self):
        return list(
            map(
                lambda event: event.as_public_dict(),
                self.events.order_by("happened_at").all(),
            )
        )

    def delete_artifacts(self):
        from core.claim_storage import ClaimReader, ClaimStore

        completed_artifact = ClaimReader(self, path=self.completed_payload_path())
        partial_artifact = ClaimReader(self, path=self.partial_payload_path())
        with transaction.atomic():
            to_delete = []
            for cr in [completed_artifact, partial_artifact]:
                logger.debug("🚀 read {}".format(cr.path))
                if cr.read():
                    to_delete.append(cr.path)
            if len(to_delete) > 0:
                resp = ClaimStore().delete(to_delete)
            else:
                resp = {"Deleted": []}
            logger.debug("🚀 resp: {}".format(resp))
            # only create Event if something actually happened
            if resp and len(resp["Deleted"]) > 0:
                self.events.create(
                    category=Claim.EventCategories.DELETED,
                    description=json_encode({"deleted": resp["Deleted"]}),
                )
                return SUCCESS
            return NOOP if resp else FAILURE
