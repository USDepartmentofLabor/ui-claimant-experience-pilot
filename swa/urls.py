# -*- coding: utf-8 -*-
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("v1/claims/", views.GET_v1_claims, name="GET_v1_claims"),
]
