# -*- coding: utf-8 -*-
"""claimantsapi URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import include, path, re_path
from django.conf.urls.static import static
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns

from core.views import claimant as claimant_app, live

urlpatterns = (
    i18n_patterns(
        path("", include(("home.urls", "home"), namespace="home")),
        prefix_default_language=False,
    )
    + [
        # wildcard pattern for react apps so that any path under that app is matched.
        re_path(r"claimant/.*$", claimant_app, name="claimant"),
        path("logindotgov/", include("login-dot-gov.urls")),
        path("api/", include("api.urls")),
        path("live/", live, name="live"),
    ]
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    + static("/", document_root=settings.STATIC_ROOT)  # this should come last
)
