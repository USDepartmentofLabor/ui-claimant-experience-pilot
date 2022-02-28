# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .identity_provider import IdentityProvider
from .event import Event
from django.db import models, transaction
from django.contrib.contenttypes.fields import GenericRelation


class Claimant(TimeStampedModel):
    class Meta:
        db_table = "claimants"
        indexes = [models.Index(fields=["encryption_key_hash"])]

    class EventCategories(models.IntegerChoices):
        LOGGED_IN = 1
        IAL = 2

    class IALOptions(models.IntegerChoices):
        IAL1 = 1
        IAL2 = 2

    idp = models.ForeignKey(IdentityProvider, on_delete=models.PROTECT)
    idp_user_xid = models.CharField(max_length=255, unique=True)
    IAL = models.IntegerField(choices=IALOptions.choices, default=IALOptions.IAL1)
    encryption_key_hash = models.CharField(max_length=64, null=True)
    events = GenericRelation(
        Event, content_type_field="model_name", object_id_field="model_id"
    )

    def last_login_event(self):
        return (
            self.events.filter(category=Claimant.EventCategories.LOGGED_IN)
            .order_by("-created_at")
            .first()
        )

    # if claimant is now at IAL2, save change. We never go the other way (2 -> 1)
    def bump_IAL_if_necessary(self, new_IAL):
        if int(new_IAL) not in Claimant.IALOptions.values:
            return
        if self.IAL == int(new_IAL):
            return
        if self.IAL == 1:
            self.IAL = int(new_IAL)
            with transaction.atomic():
                self.save()
                self.events.create(
                    category=Claimant.EventCategories.IAL, description="1 => 2"
                )
            return True

    def pending_identity_only_claim(self):
        for claim in self.claim_set.all():
            if (
                not claim.is_completed()
                and not claim.is_resolved()
                and claim.swa.is_identity_only()
                and claim.is_initiated_with_swa_xid()
            ):
                return claim
        return False
