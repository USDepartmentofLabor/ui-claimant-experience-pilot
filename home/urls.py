# -*- coding: utf-8 -*-
from django.urls import path, re_path
from . import views
from django.conf import settings
from launchdarkly.client import ld_client

urlpatterns = [
    path("", views.index, name="index"),
    path("start/<swa_code>/", views.swa_index, name="swa_index"),
    path("swa-redirect/<swa_code>/", views.swa_redirect, name="swa_redirect"),
    path("contact/<swa_code>/", views.swa_contact, name="swa_contact"),
    path("ial2required/", views.ial2required, name="ial2required"),
    path("idp/", views.idp, name="idp"),
    path("idp/<swa_code>/", views.idp, name="idp"),
    path("test/", views.test, name="test"),
    path("logout/", views.logout, name="logout"),
    path("start/", views.start, name="start"),
    path("raise_error/", views.raise_error, name="raise_error"),
    path("identity/", views.identity, name="identity"),
    path("about/", views.about, name="about"),
]

if settings.SHOW_LOGIN_PAGE:
    urlpatterns.append(path("login/", views.login))

in_maintenance_mode = ld_client.variation(
    "maintenance-mode", {"key": "anonymous-user"}, True
)
if in_maintenance_mode:
    urlpatterns = [re_path(r"^.*", views.maintenance_mode, name="maintenance_mode")]
