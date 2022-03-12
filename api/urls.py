# -*- coding: utf-8 -*-
from django.urls import path
from django.conf import settings
from launchdarkly.client import ld_client

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("whoami/", views.whoami, name="whoami"),
    path("claims/", views.claims, name="claims"),
    path("partial-claim/", views.partial_claim, name="partial-claim"),
    path("completed-claim/", views.completed_claim, name="completed-claim"),
    path("cancel-claim/<claim_id>/", views.cancel_claim, name="cancel_claim"),
    path("logout/", views.logout, name="logout"),
]

if settings.SHOW_LOGIN_PAGE:
    urlpatterns.append(path("login/", views.login))

in_maintenance_mode = ld_client.variation(
    "maintenance-mode", {"key": "anonymous-user"}, True
)
if in_maintenance_mode:
    urlpatterns = []
