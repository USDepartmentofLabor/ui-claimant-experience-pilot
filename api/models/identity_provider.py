# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from django.db import models


class IdentityProvider(TimeStampedModel):
    class Meta:
        db_table = "identity_providers"

    name = models.CharField(max_length=255, unique=True)
