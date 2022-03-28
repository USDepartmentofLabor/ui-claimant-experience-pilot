# -*- coding: utf-8 -*-
from .views import HomeViewsTestCase
from .local_login import LocalLoginTestCase
from .identity import IdentityTestCase

__all__ = [
    "HomeViewsTestCase",
    "LocalLoginTestCase",
    "IdentityTestCase",
]
