# -*- coding: utf-8 -*-
from django.shortcuts import render


def initclaim(request):
    return render(None, "build/index.html")
