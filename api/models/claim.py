# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from datetime import timedelta
from .swa import SWA
from .claimant import Claimant
from .event import Event
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
import uuid
from django.db import transaction
from django.utils import timezone
from jwcrypto.common import json_encode
import logging
from core.claim_encryption import (
    AsymmetricClaimEncryptor,
    SymmetricClaimEncryptor,
    SymmetricClaimDecryptor,
    symmetric_encryption_key,
)
from core.claim_storage import (
    BUCKET_TYPE_ARCHIVE,
    ClaimBucket,
    ClaimReader,
    ClaimStore,
    ClaimWriter,
)

logger = logging.getLogger(__name__)

NOOP = -1
SUCCESS = 1
FAILURE = 0


class ExpiredPartialClaimManager(models.Manager):
    def get_queryset(self):
        days_to_keep_inactive_partial_claim = 7  # TODO: put into env var
        threshold_date = timezone.now() - timedelta(
            days=days_to_keep_inactive_partial_claim
        )

        claims = (
            super()
            .get_queryset()
            .filter(
                updated_at__lt=threshold_date,
                events__category=Claim.EventCategories.STORED,
            )
            .exclude(events__category=Claim.EventCategories.COMPLETED)
            .exclude(events__category=Claim.EventCategories.DELETED)
            .distinct()
        )

        return claims


class Claim(TimeStampedModel):
    class Meta:
        db_table = "claims"

    class EventCategories(models.IntegerChoices):
        RESOLVED = 1
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

    objects = models.Manager()
    expired_partial_claims = ExpiredPartialClaimManager()

    def create_stored_event(self, bucket_name):
        return self.events.create(
            category=Claim.EventCategories.STORED, description=bucket_name
        )

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

    def is_resolved(self):
        return self.events.filter(category=Claim.EventCategories.RESOLVED).count() > 0

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
        completed_artifact = ClaimReader(self, path=self.completed_payload_path())
        partial_artifact = ClaimReader(self, path=self.partial_payload_path())
        with transaction.atomic():
            to_delete = []
            for cr in [completed_artifact, partial_artifact]:
                logger.debug("🚀 read {}".format(cr.path))
                if cr.exists():
                    to_delete.append(cr.path)
            if len(to_delete) > 0:
                resp = ClaimStore().delete(to_delete)
            else:
                resp = {"Deleted": []}

            if not resp:
                return FAILURE

            logger.debug("🚀 resp: {}".format(resp))

            if "Errors" in resp:
                logger.error(resp["Errors"])

            if "Deleted" not in resp:
                return FAILURE

            if len(to_delete) != len(resp["Deleted"]):
                return FAILURE

            # only create Event if something actually happened
            if len(resp["Deleted"]) > 0:
                self.events.create(
                    category=Claim.EventCategories.DELETED,
                    description=json_encode({"deleted": resp["Deleted"]}),
                )
                return SUCCESS
            # we get here if there was nothing to delete
            return NOOP

    def write_partial(self, validated_payload):
        sym_encryptor = SymmetricClaimEncryptor(
            validated_payload, symmetric_encryption_key()
        )
        packaged_claim = sym_encryptor.packaged_claim()
        packaged_payload = packaged_claim.as_json()
        try:
            # TODO depending on performance, we might want to move this to an async task
            cw = ClaimWriter(self, packaged_payload, path=self.partial_payload_path())
            if not cw.write():
                raise Exception("Failed to write partial claim")
            logger.debug("🚀 wrote partial claim")
            return True
        except Exception as error:
            logger.exception(error)
            return False

    def write_completed(self, validated_payload):
        asym_encryptor = AsymmetricClaimEncryptor(
            validated_payload, self.swa.public_key_as_jwk()
        )
        packaged_claim = asym_encryptor.packaged_claim()
        packaged_payload = packaged_claim.as_json()
        try:
            with transaction.atomic():
                self.events.create(category=Claim.EventCategories.COMPLETED)
                cw = ClaimWriter(
                    self, packaged_payload, path=self.completed_payload_path()
                )
                archiveCw = ClaimWriter(
                    self,
                    json_encode(validated_payload),
                    path=self.completed_payload_path(),
                    claim_store=ClaimStore(
                        claim_bucket=ClaimBucket(BUCKET_TYPE_ARCHIVE)
                    ),
                )
                if not cw.write() or not archiveCw.write():
                    raise Exception("Failed to write completed claim")
            logger.debug("🚀 wrote completed claim")
            return True
        except Exception as error:
            logger.exception(error)
            return False

    def read_partial(self):
        claim_reader = ClaimReader(self, path=self.partial_payload_path())
        if not claim_reader.exists():
            return False
        packaged_claim_str = claim_reader.read()
        cd = SymmetricClaimDecryptor(packaged_claim_str, symmetric_encryption_key())
        return cd.decrypt()
