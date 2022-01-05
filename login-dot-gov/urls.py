# -*- coding: utf-8 -*-
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("result", views.result, name="result"),
    path("explain", views.explain, name="explain"),
    path("ial2required", views.ial2required, name="ial2required"),
]
