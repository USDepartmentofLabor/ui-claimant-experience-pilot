# -*- coding: utf-8 -*-
from django.urls import path
from . import views
from django.conf import settings

urlpatterns = [
    path("", views.index, name="index"),
    path("swa-redirect/<swa_code>/", views.swa_redirect, name="swa_redirect"),
    path("ial2required/", views.ial2required, name="ial2required"),
    path("idp/", views.idp, name="idp"),
    path("test/", views.test, name="test"),
    path("logout/", views.logout, name="logout"),
    path("prequal/", views.prequalifications, name="prequalifications"),
]

if settings.SHOW_LOGIN_PAGE:
    urlpatterns.append(path("login/", views.login))
