# -*- coding: utf-8 -*-
from django.urls import path
from django.conf import settings

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

if settings.ENABLE_TEST_LOGIN:
    urlpatterns.append(path("login/", views.login))
