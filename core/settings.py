# -*- coding: utf-8 -*-
"""
Django settings for core project.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/3.2/ref/settings/
"""

from pathlib import Path
import os
import environ
import logging
from corsheaders.defaults import default_headers

# import pprint

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# populate os.environ with .env settings
env = environ.Env()
env.read_env()


# TODO AWS secrets manager
def load_secrets():
    return {}


# since this app usually runs behind one or more reverse proxies that may/not
# have X-Forwarded-For header set correctly, allow for explicit root URI
# to be set here via env.
# NOTE this value should *NOT* contain a trailing slash
BASE_URL = os.environ.get("BASE_URL", None)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = "django-insecure-ncqf$a36l&71aeo(^&i0mddiz6-g9zl23)6uvu7@m$$t8%m=s+"
# TODO load from secrets

# SECURITY WARNING: don't run with debug turned on in production!
# TODO read from env var
DEBUG = True

# TODO read from env var
ALLOWED_HOSTS = [
    "localhost",
    ".dol.gov",
    ".unemployment.gov",
    ".ui.gov",
]

# TODO colorized logging?
logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("core")

# Application definition

INSTALLED_APPS = [
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "api",
    "login-dot-gov",
    "secure_redis",
    "home",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

WSGI_APPLICATION = "core.wsgi.application"

# caching. sessions use the same cache, but have a custom serializer
REDIS_DB = 0
REDIS_URL = os.environ.get("REDIS_URL", f"redis://host.docker.internal:6379/{REDIS_DB}")
redis_base_options = {
    "DB": REDIS_DB,
    "CLIENT_CLASS": "django_redis.client.DefaultClient",
    "SOCKET_CONNECT_TIMEOUT": 5,  # in seconds
    "SOCKET_TIMEOUT": 5,  # seconds
}
if os.environ.get("REDIS_HOST"):
    # in WCMS env the config is set with separate env vars.
    REDIS_URL = f"rediss://{os.environ.get('REDIS_HOST')}:{os.environ.get('REDIS_PORT', '6379')}/{REDIS_DB}"
    redis_base_options["CONNECTION_POOL_KWARGS"] = {"ssl_cert_reqs": None}
    redis_base_options["REDIS_CLIENT_KWARGS"] = {"ssl": True, "ssl_cert_reqs": None}
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": redis_base_options
        | {
            # 'PARSER_CLASS': 'redis.connection.HiredisParser',
            # A URL-safe base64-encoded 32-byte key.
            "REDIS_SECRET_KEY": "kPEDO_pSrPh3qGJVfGAflLZXKAh4AuHU64tTlP-f_PY=",  # TODO load from secrets
            "SERIALIZER": "secure_redis.serializer.SecureSerializer",
        },
        "KEY_PREFIX": "claimantsapi:secure",
        "TIMEOUT": 60 * 15,  # expire in 15 minutes TODO security requirement
    },
    "insecure": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": redis_base_options
        | {
            # 'PARSER_CLASS': 'redis.connection.HiredisParser',
        },
        "KEY_PREFIX": "claimantsapi",
        "TIMEOUT": 60 * 60 * 24,  # 1 day
    },
}
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_SAVE_EVERY_REQUEST = True  # keep-alive on each request
SESSION_EXPIRY = env.int(
    "SESSION_EXPIRY", 30 * 60
)  # 30 minute timeout on no requests TODO
SESSION_COOKIE_AGE = env.int("SESSION_EXPIRY", 30 * 60)
# allow XHR/CORS to work in local dev with http/https mix
# CSRF_COOKIE_SAMESITE = 'None'
# NOTE that this assumes you are running react app on http and django on https behind proxy
# Chrome requires SameSite=None to be paired with Secure
SESSION_COOKIE_SAMESITE = "None"
SESSION_COOKIE_SECURE = True

# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
mysql_default = "mysql://user:secret@host.docker.internal:3306/unemployment"
default_db = env.db_url("DATABASE_URL", mysql_default)
# allow for password to be stored separately from connection string
if not default_db["PASSWORD"]:
    default_db["PASSWORD"] = env("DATABASE_PASSWORD")

default_db["OPTIONS"] = {
    "init_command": "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'"
}

# disabled till we have RDS, models, migrations
# DATABASES = {"default": default_db}
# this is the default just to quiet the dummy db warning/error
# it should never actually get created, since we don't yet have any models.
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": "mydatabase"}}


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "initclaim", "build", "static"),)

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "initclaim")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = [
    "https://sandbox.ui.dol.gov:4430",
    "http://sandbox.ui.dol.gov:8004",
    "http://sandbox.ui.dol.gov:3000",
    "http://localhost:8004",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.+\.dol\.gov$",
    r"^https://.+\.unemployment\.gov$",
    r"^https://.+\.ui\.gov$",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    "Cache-Control",
    "If-Modified-Since",
    "Keep-Alive",
    "X-Requested-With",
    "X-DOL",
]

# Identity Providers
LOGIN_DOT_GOV_REDIRECT_URI = os.environ.get(
    "LOGIN_DOT_GOV_REDIRECT_URI", "https://sandbox.ui.dol.gov:4430/logindotgov/result"
)
LOGIN_DOT_GOV_SCOPES = env.list(
    "LOGIN_DOT_GOV_SCOPES",
    default=[
        "openid",
        "email",
        "phone",
        "address",
        "profile",
        "social_security_number",
    ],
)
LOGIN_DOT_GOV_CLIENT_ID = os.environ.get(
    "LOGIN_DOT_GOV_CLIENT_ID",
    "urn:gov:gsa:openidconnect.profiles:sp:sso:dol:ui-arpa-claimant-sandbox",
)

if os.environ.get("LOGIN_DOT_GOV_ENV") == "test":
    # generate a new key pair on the fly
    from jwcrypto import jwk
    from jwcrypto.common import json_decode

    # use only 1024 bits since this is temporary key and we favor speed.
    client_private_key_jwk = jwk.JWK.generate(kty="RSA", size=1024)
    LOGIN_DOT_GOV_PRIVATE_KEY = client_private_key_jwk.export_to_pem(True, None).decode(
        "utf-8"
    )
    client_public_key_jwk = jwk.JWK()
    client_public_key_jwk.import_key(
        **json_decode(client_private_key_jwk.export_public())
    )
    LOGIN_DOT_GOV_PUBLIC_KEY = client_public_key_jwk.export_to_pem().decode("utf-8")
else:  # pragma: no cover
    # TODO read from secrets
    logindotgov_private_key = ""
    private_key_file = (
        BASE_DIR
        / "certs"
        / os.environ.get("LOGIN_DOT_GOV_PRIVATE_KEY_FILE", "logindotgov-private.pem")
    )
    from os.path import exists as file_exists

    if file_exists(private_key_file):
        with open(private_key_file, "rb") as pf:
            logindotgov_private_key = pf.read()
        LOGIN_DOT_GOV_PRIVATE_KEY = logindotgov_private_key
    else:
        logger.warn("LOGIN_DOT_GOV_PRIVATE_KEY set to False as .pem could not be found")
        LOGIN_DOT_GOV_PRIVATE_KEY = False
