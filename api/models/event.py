# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from django.db import models
from django.utils import timezone
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Event(TimeStampedModel):
    class Meta:
        db_table = "events"
        indexes = [
            models.Index(fields=["model_name", "model_id"]),
            models.Index(fields=["category"]),
            models.Index(fields=["happened_at"]),
        ]

    model_name = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    model_id = models.BigIntegerField()
    category = models.IntegerField()
    description = models.CharField(max_length=255)
    happened_at = models.DateTimeField(default=timezone.now)
    event_target = GenericForeignKey("model_name", "model_id")

    # because our enum "choices" are defined on the event_target,
    # we must define this method ourselves.
    def get_category_display(self):
        categories = dict(type(self.event_target).EventCategories.choices)
        if self.category in categories:
            return categories[self.category]
        else:
            return "Unknown"

    def as_public_dict(self):
        return {
            "happened_at": str(self.happened_at),
            "category": self.get_category_display(),  # public word not integer
            "description": self.description,
        }
