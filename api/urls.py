# -*- coding: utf-8 -*-
from django.urls import path
from django.conf import settings

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("whoami/", views.whoami, name="whoami"),
    path("claim/", views.claim, name="claim"),
    path("logout/", views.logout, name="logout"),
]

if settings.SHOW_LOGIN_PAGE:
    urlpatterns.append(path("login/", views.login))
