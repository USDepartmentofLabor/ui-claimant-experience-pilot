# -*- coding: utf-8 -*-
import hashlib
from api.models import IdentityProvider
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from django.contrib.sessions.backends.cache import KEY_PREFIX as SESSION_KEY_PREFIX
from django.conf import settings


def session_as_dict(request):
    this_session = {
        "_session_key": request.session.session_key,
    }
    for k in request.session.keys():
        this_session[k] = request.session[k]
    return this_session


def get_session_store():
    return cache.client.get_client()


def get_session_cache_key(session_key):
    store_prefix = settings.CACHES["default"]["KEY_PREFIX"]
    version = "1"  # django.core.cache.backends.BaseCache defaults to this
    return f"{store_prefix}:{version}:{SESSION_KEY_PREFIX}{session_key}"


def get_session_expires_at(session_key):
    key = get_session_cache_key(session_key)
    ttl = cache.ttl(key)
    return timezone.now() + timedelta(0, ttl)


def get_session(session_key):
    return cache.get(cache.client.reverse_key(get_session_cache_key(session_key)))


def register_local_login(request):
    from .local_idp import LocalIdentityProvider

    idp = LocalIdentityProvider(request)
    return idp.login()


def hash_idp_user_xid(user_xid):
    return hashlib.sha256(user_xid.encode("utf-8")).hexdigest()


def local_identity_provider():
    idp, _ = IdentityProvider.objects.get_or_create(name="Local")
    return idp
