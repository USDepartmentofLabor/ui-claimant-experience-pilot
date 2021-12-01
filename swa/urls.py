# -*- coding: utf-8 -*-
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("v1/claims/", views.GET_v1_claims, name="GET_v1_claims"),
    path("v1/claims/<claim_uuid>/", views.v1_act_on_claim, name="v1_act_on_claim"),
]
