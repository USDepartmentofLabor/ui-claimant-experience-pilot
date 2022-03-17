# -*- coding: utf-8 -*-
from django.shortcuts import render


def index(request):
    return render(request, "reference/index.html")


def plain_language(request):
    return render(request, "reference/plain_language.html")
