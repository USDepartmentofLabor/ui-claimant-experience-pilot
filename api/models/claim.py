# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from datetime import timedelta
from .swa import SWA
from .claimant import Claimant
from .event import Event
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation
from django.conf import settings
import uuid
from django.db import transaction
from django.utils import timezone
from jwcrypto.common import json_encode
import logging
from core.exceptions import ClaimStorageError
from core.claim_encryption import (
    AsymmetricClaimEncryptor,
    SymmetricClaimEncryptor,
    RotatableSymmetricClaimDecryptor,
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

# see Claim.status_for_claimant
# this is a pseudo-enum (derived from events, not a column)
CLAIMANT_STATUS_IN_PROCESS = "in_process"
CLAIMANT_STATUS_CANCELLED = "cancelled"
CLAIMANT_STATUS_PROCESSING = "processing"
CLAIMANT_STATUS_ACTIVE = "active"
CLAIMANT_STATUS_RESOLVED = "resolved"
CLAIMANT_STATUS_DELETED = "deleted"
CLAIMANT_STATUS_UNKNOWN = "unknown"


class ExpiredPartialClaimManager(models.Manager):
    def delete_artifacts(self):
        count = 0
        for claim in self.all():
            status = claim.delete_artifacts()
            if status == SUCCESS:
                count += 1
            logger.info(f"Total expired partial claims deleted: {count}")
        return count

    def get_queryset(self):
        days_to_keep_inactive_partial_claim = settings.DELETE_PARTIAL_CLAIM_AFTER_DAYS
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
        INITIATED_WITH_SWA_XID = 9

    uuid = models.UUIDField(default=uuid.uuid4, unique=True)
    swa = models.ForeignKey(SWA, on_delete=models.PROTECT)
    claimant = models.ForeignKey(Claimant, on_delete=models.PROTECT)
    status = models.CharField(max_length=255, null=True)
    swa_xid = models.CharField(max_length=255, null=True, unique=True)
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

    def completed_at(self):
        if not self.is_completed():
            return None
        return (
            self.events.filter(category=Claim.EventCategories.COMPLETED)
            .first()
            .happened_at
        )

    def is_resolved(self):
        return self.events.filter(category=Claim.EventCategories.RESOLVED).count() > 0

    def resolved_at(self):
        if not self.is_resolved():
            return None
        return (
            self.events.filter(category=Claim.EventCategories.RESOLVED)
            .first()
            .happened_at
        )

    def resolution_description(self):
        if not self.is_resolved():
            return None
        return (
            self.events.filter(category=Claim.EventCategories.RESOLVED)
            .first()
            .description
        )

    def is_deleted(self):
        return self.events.filter(category=Claim.EventCategories.DELETED).count() > 0

    def deleted_at(self):
        if not self.is_deleted():
            return None
        return (
            self.events.filter(category=Claim.EventCategories.DELETED)
            .first()
            .happened_at
        )

    def is_fetched(self):
        return self.events.filter(category=Claim.EventCategories.FETCHED).count() > 0

    def fetched_at(self):
        if not self.is_fetched():
            return None
        return (
            self.events.filter(category=Claim.EventCategories.FETCHED)
            .first()
            .happened_at
        )

    def is_initiated_with_swa_xid(self):
        return (
            self.events.filter(
                category=Claim.EventCategories.INITIATED_WITH_SWA_XID
            ).count()
            > 0
        )

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
                raise ClaimStorageError("Failed to write partial claim")
            logger.debug("🚀 wrote partial claim")
            return True
        except ClaimStorageError as error:
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
                if not cw.write():
                    raise ClaimStorageError("Failed to write completed claim")
                archive_cw = ClaimWriter(
                    self,
                    json_encode(validated_payload),
                    path=self.completed_payload_path(),
                    claim_store=ClaimStore(
                        claim_bucket=ClaimBucket(BUCKET_TYPE_ARCHIVE)
                    ),
                )
                if not archive_cw.write():
                    raise ClaimStorageError(
                        "Failed to write completed claim to archive"
                    )
            logger.debug("🚀 wrote completed claim")
            return True
        except ClaimStorageError as error:
            logger.exception(error)
            return False

    def read_partial(self):
        claim_reader = ClaimReader(self, path=self.partial_payload_path())
        if not claim_reader.exists():
            return False
        packaged_claim_str = claim_reader.read()
        cd = RotatableSymmetricClaimDecryptor(
            packaged_claim_str, settings.CLAIM_SECRET_KEY
        )
        return cd.decrypt()

    # returns a constant that reflects the status of the claim from the Claimant's perspective
    def status_for_claimant(self):
        if not self.is_completed() and not self.is_deleted() and not self.is_resolved():
            return CLAIMANT_STATUS_IN_PROCESS
        if (
            self.is_completed()
            and self.is_deleted()
            and self.is_resolved()
            and not self.is_fetched()
        ):
            return CLAIMANT_STATUS_CANCELLED
        if self.is_completed() and not self.is_fetched():
            return CLAIMANT_STATUS_PROCESSING
        if self.is_completed() and self.is_fetched() and not self.is_resolved():
            return CLAIMANT_STATUS_ACTIVE
        if self.is_fetched() and self.is_resolved():
            return CLAIMANT_STATUS_RESOLVED
        if self.is_deleted():
            return CLAIMANT_STATUS_DELETED
        return CLAIMANT_STATUS_UNKNOWN

    def should_be_deleted_after(self):
        if self.is_deleted() or self.is_completed():
            return False
        return self.updated_at + timedelta(
            days=settings.DELETE_PARTIAL_CLAIM_AFTER_DAYS
        )
