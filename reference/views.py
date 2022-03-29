# -*- coding: utf-8 -*-
from django.shortcuts import render


def index(request):
    return render(request, "reference/index.html", {"active": "introduction"})


def plain_language(request):
    return render(
        request, "reference/plain_language.html", {"active": "plain_language"}
    )


def open_source(request):
    return render(request, "reference/open_source.html", {"active": "open_source"})


def iterating(request):
    return render(request, "reference/iterating.html", {"active": "iterating"})
