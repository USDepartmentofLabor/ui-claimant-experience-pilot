# -*- coding: utf-8 -*-
from django.urls import path
from . import views
from django.conf import settings

urlpatterns = [
    path("", views.index),
    path("idp/", views.idp),
    path("test/", views.test),
]

if settings.DEBUG:
    urlpatterns.append(path("login/", views.login))
