# -*- coding: utf-8 -*-
from .base import TimeStampedModel
from .identity_provider import IdentityProvider
from django.db import models


class ActiveSwaManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status=SWA.StatusOptions.ACTIVE)


class SWA(TimeStampedModel):
    class Meta:
        db_table = "swas"

    class StatusOptions(models.IntegerChoices):
        INACTIVE = 0
        ACTIVE = 1

    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=255, unique=True)
    public_key_fingerprint = models.CharField(max_length=255, null=True)
    public_key = models.TextField(null=True)
    claimant_url = models.CharField(max_length=255, null=True)
    idp = models.ForeignKey(IdentityProvider, null=True, on_delete=models.SET_NULL)
    status = models.IntegerField(
        choices=StatusOptions.choices, default=StatusOptions.INACTIVE
    )

    objects = models.Manager()  # MUST come first
    active = ActiveSwaManager()

    def public_key_as_jwk(self):
        from jwcrypto import jwk

        return jwk.JWK.from_pem(self.public_key.encode("utf-8"))
