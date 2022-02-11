# -*- coding: utf-8 -*-
from django.urls import path
from . import views
from django.conf import settings

urlpatterns = [
    path("", views.index, name="index"),
    path("start/<swa_code>/", views.swa_index, name="swa_index"),
    path("swa-redirect/<swa_code>/", views.swa_redirect, name="swa_redirect"),
    path("contact/<swa_code>/", views.swa_contact, name="swa_contact"),
    path("ial2required/", views.ial2required, name="ial2required"),
    path("idp/", views.idp, name="idp"),
    path("test/", views.test, name="test"),
    path("logout/", views.logout, name="logout"),
    path("start/", views.start, name="start"),
]

if settings.SHOW_LOGIN_PAGE:
    urlpatterns.append(path("login/", views.login))
