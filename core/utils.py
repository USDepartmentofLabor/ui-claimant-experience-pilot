# -*- coding: utf-8 -*-
import json
import hashlib
from api.models import Claimant, IdentityProvider


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
    if "email" in whoami:
        if len(whoami["email"]):
            xid = hash_idp_user_xid(whoami["email"])
            # ok to ignore return value
            Claimant.objects.get_or_create(
                idp_user_xid=xid, idp=local_identity_provider()
            )
            whoami["claimant_id"] = xid
    return whoami


def hash_idp_user_xid(user_xid):
    return hashlib.sha256(user_xid.encode("utf-8")).hexdigest()


def local_identity_provider():
    idp, _ = IdentityProvider.objects.get_or_create(name="Local")
    return idp
