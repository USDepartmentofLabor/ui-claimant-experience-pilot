# -*- coding: utf-8 -*-
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("plain-language/", views.plain_language, name="plain_language"),
    path("open-source/", views.open_source, name="open_source"),
]
