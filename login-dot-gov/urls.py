# -*- coding: utf-8 -*-
from django.urls import re_path, path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    re_path(r"result/?", views.result, name="result"),
    re_path(r"explain/?", views.explain, name="explain"),
    re_path(r"profile/?", views.profile, name="profile"),
    re_path(r"ial2required/?", views.ial2required, name="ial2required"),
]
