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

from core.views import claimant as claimant_app, live, raise_error

handler404 = "home.views.handle_404"
handler500 = "home.views.handle_500"

urlpatterns = [
    path("", include(("home.urls", "home"), namespace="home")),
    path("500/", raise_error),
    # wildcard pattern for react apps so that any path under that app is matched.
    re_path(r"claimant/.*$", claimant_app, name="claimant"),
    path("logindotgov/", include("login-dot-gov.urls")),
    path("api/", include("api.urls")),
    path("swa/", include("swa.urls")),
    path("live/", live, name="live"),
    path("reference/", include("reference.urls")),
]
