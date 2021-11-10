# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .identity_provider import IdentityProvider
from .event import Event
from django.db import models
from django.contrib.contenttypes.fields import GenericRelation


class Claimant(TimeStampedModel):
    class Meta:
        db_table = "claimants"

    class EventCategories(models.IntegerChoices):
        LOGGED_IN = 1

    idp = models.ForeignKey(IdentityProvider, on_delete=models.PROTECT)
    idp_user_xid = models.CharField(max_length=255, unique=True)
    events = GenericRelation(
        Event, content_type_field="model_name", object_id_field="model_id"
    )
