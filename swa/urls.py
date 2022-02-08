# -*- coding: utf-8 -*-
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("v1/claims/", views.GET_v1_claims, name="GET_v1_claims"),
    path("v1/claims/<claim_uuid>/", views.v1_act_on_claim, name="v1_act_on_claim"),
    path(
        "v1/claimants/<claimant_id>/1099G/",
        views.v1_act_on_claimant_1099G,
        name="v1_act_on_claimant_1099G",
    ),
]
