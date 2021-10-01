# -*- coding: utf-8 -*-
import json


def session_as_dict(request):
    this_session = {
        "_session_key": request.session.session_key,
    }
    for k in request.session.keys():
        this_session[k] = request.session[k]
    return this_session


def register_local_login(request):
    request.session["verified"] = True
    whoami = {}
    if request.content_type == "application/json":
        whoami = json.loads(request.body)
    else:
        for k in request.POST.keys():
            whoami[k] = request.POST[k]
    request.session["whoami"] = whoami
    return whoami
