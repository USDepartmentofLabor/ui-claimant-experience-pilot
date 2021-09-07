# -*- coding: utf-8 -*-
from django.shortcuts import render


def index(request):
    return render(None, "index.html", {"foo": "bar"})
