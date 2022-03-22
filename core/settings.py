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
import logging.config
import base64

# our symmetric encryptions keys must be 32 bytes (256 bits) base64-encoded


def validate_secret_key(secret, key_name):
    secret_len = len(base64.urlsafe_b64decode(secret))
    if secret_len != 32:  # pragma: no cover
        err = "{} '{}' is not a 32-byte base64-encoded string: {} [{}]".format(
            key_name,
            secret,
            base64.urlsafe_b64decode(secret),
            secret_len,
        )
        raise ValueError(err)
    return True


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Form data test fixtures live in React dir for local development only
FIXTURE_DIR = BASE_DIR / "api" / "fixtures" / "claim-form"
if os.environ.get("ENV_NAME") == "devlocal":
    FIXTURE_DIR = BASE_DIR / "claimant" / "src" / "fixtures" / "claim-form"

# populate os.environ with .env settings
env = environ.Env()
env.read_env(env.str("ENV_PATH", "core/.env"))

TEST_RUNNER = "core.test_runner.MyTestRunner"

# since this app usually runs behind one or more reverse proxies that may/not
# have X-Forwarded-For header set correctly, allow for explicit root URI
# to be set here via env.
# NOTE this value should *NOT* contain a trailing slash
BASE_URL = os.environ.get("BASE_URL", None)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
# env.bool is tricky to get right so opt for strict string comparison
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"

# tie together multiple log lines with a common id
REQUEST_ID_CONFIG = {
    "REQUEST_ID_HEADER": "HTTP_X_REQUEST_ID",
    "GENERATE_REQUEST_ID_IF_NOT_FOUND": True,
    "RESPONSE_HEADER_REQUEST_ID": "HTTP_X_REQUEST_ID",
}

ALLOWED_HOSTS = [
    "localhost",
    ".dol.gov",
    ".unemployment.gov",
    ".ui.gov",
]

logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("core")
if os.environ.get("COLOR_LOGGING", "false").lower() == "true":  # pragma: no cover
    LOGGING_CONFIG = None  # This empties out Django's logging config
    LOGGING = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {"()": "request_id_django_log.filters.RequestIDFilter"}
        },
        "formatters": {
            "colored": {
                "()": "colorlog.ColoredFormatter",  # colored output
                # --> %(log_color)s is very important, that's what colors the line
                "format": "%(log_color)s[%(levelname)s] %(reset)s %(green)s[%(request_id)s] %(reset)s%(blue)s%(name)s - %(asctime)s :: %(reset)s %(message)s",
                "log_colors": {
                    "DEBUG": "blue",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "bold_red",
                },
            },
            # TODO determine config for CloudWatch
            "aws": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "console": {
                "level": "DEBUG",
                "class": "colorlog.StreamHandler",
                "formatter": "colored",
                "filters": ["request_id"],
            },
        },
        "loggers": {
            "django.utils.autoreload": {"level": "INFO"},
            "": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        },
    }
    logging.config.dictConfig(LOGGING)  # Finally replace our config in python logging

# Application definition

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.messages",
    "include_strip_tag",
    "whitenoise.runserver_nostatic",
    "django.contrib.staticfiles",
    "api",
    "login-dot-gov",
    "secure_redis",
    "home",
    "swa",
    "reference",
    "appoptics_apm.djangoware",
    "launchdarkly.apps.LaunchdarklyConfig",
]

# only install in dev/ci
if os.environ.get("ENV_NAME") != "wcms":
    INSTALLED_APPS += ("django_extensions",)

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "api.middleware.session.SessionTimeout",
    "django.middleware.locale.LocaleMiddleware",  # must come after session middleware and before common middleware
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "csp.middleware.CSPMiddleware",
    "request_id_django_log.middleware.RequestIdDjangoLog",
    "swa.middleware.auth.SWAAuth",
    "reference.middleware.visible.ReferenceVisibility",
    "core.middleware.maintenance_mode.MaintenanceMode",
]

ROOT_URLCONF = "core.urls"

WSGI_APPLICATION = "core.wsgi.application"

# caching. sessions use the same cache, but have a custom serializer
REDIS_DB = 0
REDIS_URL = os.environ.get("REDIS_URL", f"rediss://elasticache:6379/{REDIS_DB}")
redis_base_options = {
    "DB": REDIS_DB,
    "CLIENT_CLASS": "django_redis.client.DefaultClient",
    "SOCKET_CONNECT_TIMEOUT": 5,  # in seconds
    "SOCKET_TIMEOUT": 5,  # seconds
    "CONNECTION_POOL_KWARGS": {"ssl_cert_reqs": None},
    "REDIS_CLIENT_KWARGS": {"ssl": True, "ssl_cert_reqs": None},
}
redis_secret_key = env.str("REDIS_SECRET_KEY")
validate_secret_key(redis_secret_key, "REDIS_SECRET_KEY")
if os.environ.get("REDIS_HOST"):  # pragma: no cover
    # in WCMS env the config is set with separate env vars.
    REDIS_URL = f"rediss://{os.environ.get('REDIS_HOST')}:{os.environ.get('REDIS_PORT', '6379')}/{REDIS_DB}"
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": redis_base_options
        | {
            # 'PARSER_CLASS': 'redis.connection.HiredisParser',
            # A URL-safe base64-encoded 32-byte key.
            "REDIS_SECRET_KEY": redis_secret_key,
            "SERIALIZER": "secure_redis.serializer.SecureSerializer",
        },
        "KEY_PREFIX": "claimantsapi-secure",
        # expire in 30 minutes after last activity - TODO this might be ignored by session ttl logic
        "TIMEOUT": 60 * 30,
    },
    "insecure": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": redis_base_options
        | {
            # 'PARSER_CLASS': 'redis.connection.HiredisParser',
        },
        "KEY_PREFIX": "claimantsapi-insecure",
        "TIMEOUT": 60 * 60 * 24,  # 1 day
    },
}
# logger.debug("CACHES={}".format(pprint.pformat(CACHES)))
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_SAVE_EVERY_REQUEST = False  # we keep-alive in our Session middleware
# 30 minute timeout after last activity
# we made this SESSION_EXPIRY so it's clear what it does. COOKIE_AGE is a little misleading.
SESSION_COOKIE_AGE = env.int("SESSION_EXPIRY", 30 * 60)
# if expire on browser close is True, then the cookie expiration date is not set.
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# allow XHR/CORS to work in local dev with http/https mix,
# SESSION_COOKIE_SAMESITE is set to None in the .env-example for dev.
# NOTE that this assumes you are running react app on http and django on https behind proxy
# Chrome requires SameSite=None to be paired with Secure
# The Chrome default is Lax so if this env var is not set, it should behave as if not set.
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = (
    os.environ.get("SESSION_COOKIE_SECURE", "true").lower() == "true"
)

CSRF_COOKIE_AGE = None
CSRF_COOKIE_SECURE = True

# SameSite setting for non-session cookies.
COOKIE_SAMESITE = SESSION_COOKIE_SAMESITE

# Database
# https://docs.djangoproject.com/en/3.2/ref/settings/#databases
if os.environ.get("DATABASE_URL"):
    default_db = env.db_url("DATABASE_URL")
    # allow for password to be stored separately from connection string
    if not default_db["PASSWORD"]:
        default_db["PASSWORD"] = env("DATABASE_PASSWORD")
elif os.environ.get("DB_SCHEMA"):  # pragma: no cover
    default_db = {
        "ENGINE": "django.db.backends.mysql",
        "NAME": env.str("DB_SCHEMA"),
        "USER": env.str("DB_ADMIN_USER"),
        "PASSWORD": env.str("DB_PWD"),
        "HOST": env.str("DB_HOST", "mysql-service"),  # WCMS creates DNS entry for this
        "PORT": "3306",
        "TEST": {
            "NAME": env.str("DB_SCHEMA"),  # re-use provisioned schema in lower envs
        },
    }
else:  # pragma: no cover
    default_db = {"ENGINE": "django.db.backends.sqlite3", "NAME": "mydatabase"}


if "mysql" in default_db["ENGINE"]:
    default_db["OPTIONS"] = {
        "init_command": "SET sql_mode='STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO'"
    }

# logger.debug("DATABASES={}".format(pprint.pformat(default_db)))

DATABASES = {"default": default_db}

# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = "en"

TIME_ZONE = "UTC"

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "static")
STATICFILES_DIRS = (os.path.join(BASE_DIR, "claimant", "build", "static"),)
WHITENOISE_ROOT = STATIC_ROOT

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [os.path.join(BASE_DIR, "claimant")],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.messages.context_processors.messages",
                "core.context_processors.base_url",
                "core.context_processors.common_vars",
                "core.context_processors.ld_flags",
            ],
        },
    },
]

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Note: In Django 4, SecurityMiddleware no longer sets the X-XSS-Protection header
# https://docs.djangoproject.com/en/4.0/releases/4.0/#securitymiddleware-no-longer-sets-the-x-xss-protection-header
SECURE_BROWSER_XSS_FILTER = True

# Content-Security-Policy configuration
CSP_DEFAULT_SRC = None
CSP_FRAME_ANCESTORS = ["'none'"]

# Email
EMAIL_HOST = env.str("SMTP_HOSTNAME")
EMAIL_PORT = env.str("SMTP_PORT")
EMAIL_HOST_USER = env.str("SMTP_USERNAME", default=None)
EMAIL_HOST_PASSWORD = env.str("SMTP_PASSWORD", default=None)
EMAIL_FROM = env.str("EMAIL_FROM", default="no-reply@dol.gov")
EMAIL_REPLY_TO = env.str("EMAIL_REPLY_TO", default="no-reply@dol.gov")

# Identity Providers
LOGIN_DOT_GOV_REDIRECT_URI = os.environ.get("LOGIN_DOT_GOV_REDIRECT_URI")
LOGIN_DOT_GOV_CLIENT_ID = os.environ.get("LOGIN_DOT_GOV_CLIENT_ID")

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
        LOGIN_DOT_GOV_PRIVATE_KEY = (
            logindotgov_private_key.decode("utf-8")
            .replace(" ", "\n")
            .replace("\nPRIVATE\n", " PRIVATE ")
            .encode("utf-8")
        )
    else:
        logger.warn("LOGIN_DOT_GOV_PRIVATE_KEY set to False as .pem could not be found")
        LOGIN_DOT_GOV_PRIVATE_KEY = False

# The /login/ page bypasses all other IdP so never allow in production
if BASE_URL == "https://unemployment.dol.gov":
    ENABLE_TEST_LOGIN = False
else:
    ENABLE_TEST_LOGIN = os.environ.get("ENABLE_TEST_LOGIN", "false").lower() == "true"

# the bare /idp/ route returns 404 unless this is true
SHOW_IDP_PAGE_FOR_ALL_SWAS = (
    os.environ.get("SHOW_IDP_PAGE_FOR_ALL_SWAS", "false").lower() == "true"
)

# Celery is our task runner
# unfortunately the ssl config syntax is different than for CACHES
# we turn cert verification OFF since in WCMS/AWS we don't have a CA chain to verify.
# we accept that risk because the AWS config prevents anyone but our app from connecting
# to Redis.
CELERY_BROKER_URL = REDIS_URL + "?ssl_cert_reqs=none"
CELERY_RESULT_BACKEND = REDIS_URL + "?ssl_cert_reqs=none"

# this env var triggers kombu-fernet-serializers for Celery encryption
os.environ["KOMBU_FERNET_KEY"] = redis_secret_key

# S3
AWS_S3_ENDPOINT_URL = env.str("AWS_S3_ENDPOINT_URL", "https://s3.amazonaws.com")
TEST_CLAIM_BUCKET_NAME = env.str("TEST_S3_BUCKET_URL", "usdol-ui-claims-test")
CLAIM_BUCKET_NAME = env.str("S3_BUCKET_URL", "usdol-ui-claims")
TEST_ARCHIVE_BUCKET_NAME = env.str(
    "TEST_S3_ARCHIVE_BUCKET_URL", "usdol-ui-archive-test"
)
ARCHIVE_BUCKET_NAME = env.str("S3_ARCHIVE_BUCKET_URL", "usdol-ui-archive")

# CLAIM_SECRET_KEY is what we use to symmetrically encrypt claims-in-progress
# and Claimant files.
# Note that it can be a JSON array of keys, to allow for rotation.
claim_secret_key = env.str("CLAIM_SECRET_KEY")
if claim_secret_key.startswith("["):
    claim_secret_keys = env.json("CLAIM_SECRET_KEY")
    for idx, key in enumerate(claim_secret_keys):
        validate_secret_key(key, f"CLAIM_SECRET_KEY[{idx}]")
    CLAIM_SECRET_KEY = claim_secret_keys
else:
    validate_secret_key(claim_secret_key, "CLAIM_SECRET_KEY")
    CLAIM_SECRET_KEY = [claim_secret_key]

# all sites except production should have this turned on, as policy.
# we make it an env var so that we can test locally w/o it
DISPLAY_TEST_SITE_BANNER = (
    os.environ.get("DISPLAY_TEST_SITE_BANNER", "true").lower() == "true"
)

LD_SDK_KEY = env.str("LD_SDK_KEY")
LD_CLIENT_SDK_KEY = env.str("LD_CLIENT_SDK_KEY")

DELETE_PARTIAL_CLAIM_AFTER_DAYS = env.int("DELETE_PARTIAL_CLAIM_AFTER_DAYS", 7)

# override with JSON-encoded object of swa.code -> int (days)
EXPIRE_SWA_XID_CLAIMS_AFTER = env.json("EXPIRE_SWA_XID_CLAIMS_AFTER", {"AR": 47})
# override with JSON-encoded object of swa.code -> pytz timezone string
SWA_XID_TIMEZONES = env.json("SWA_XID_TIMEZONES", {"AR": "US/Central"})
# override with JSON-encoded object of swa.code -> regex string
SWA_XID_PATTERNS = env.json("SWA_XID_PATTERNS", {"AR": "^\\d{8}-\\d{6}-\\d{7}-\\d{9}$"})
