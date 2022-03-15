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

    class FeatureSetOptions(models.IntegerChoices):
        CLAIM_AND_IDENTITY = 1
        IDENTITY_ONLY = 2
        CLAIM_ONLY = 3

    code = models.CharField(max_length=2, unique=True)
    name = models.CharField(max_length=255, unique=True)
    public_key_fingerprint = models.CharField(max_length=255, null=True)
    public_key = models.TextField(null=True)
    claimant_url = models.CharField(max_length=255, null=True)
    idp = models.ForeignKey(IdentityProvider, null=True, on_delete=models.SET_NULL)
    status = models.IntegerField(
        choices=StatusOptions.choices, default=StatusOptions.INACTIVE
    )
    featureset = models.IntegerField(
        choices=FeatureSetOptions.choices, default=FeatureSetOptions.CLAIM_AND_IDENTITY
    )

    objects = models.Manager()  # MUST come first
    active = ActiveSwaManager()

    def public_key_as_jwk(self):
        if not self.public_key:
            raise ValueError("SWA {} is missing a public_key".format(self.code))

        from jwcrypto import jwk

        return jwk.JWK.from_pem(self.public_key.encode("utf-8"))

    def is_identity_only(self):
        return self.featureset == SWA.FeatureSetOptions.IDENTITY_ONLY

    def for_whoami(self):
        return {
            "code": self.code,
            "name": self.name,
            "claimant_url": self.claimant_url,
            "featureset": self.get_featureset_display(),
        }

    def claim_queue(self):
        from .claim import Claim

        return (
            self.claim_set.filter(events__category=Claim.EventCategories.COMPLETED)
            .exclude(
                events__category__in=[
                    Claim.EventCategories.FETCHED,
                    Claim.EventCategories.RESOLVED,
                    Claim.EventCategories.DELETED,
                ]
            )
            .order_by("created_at")
        )
