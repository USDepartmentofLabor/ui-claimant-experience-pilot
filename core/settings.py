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

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# populate os.environ with .env settings
env = environ.Env()
env.read_env()

# TODO AWS secrets manager
def load_secrets():
    return {}

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/3.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-ncqf$a36l&71aeo(^&i0mddiz6-g9zl23)6uvu7@m$$t8%m=s+'
# TODO load from secrets

# SECURITY WARNING: don't run with debug turned on in production!
# TODO read from env var
DEBUG = True

# TODO read from env var
ALLOWED_HOSTS = ["localhost", "sandbox.ui.dol.gov"]

# TODO colorized logging?
logging.basicConfig(
    level=logging.DEBUG if DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Application definition

INSTALLED_APPS = [
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    # TODO 'login-dot-gov',
    'secure_redis',
    'home',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

WSGI_APPLICATION = 'core.wsgi.application'

# caching. sessions use the same cache, but have a custom serializer
REDIS_URL = os.environ.get("REDIS_URL", "redis://host.docker.internal:6379/1")
REDIS_DB = 0
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "DB": REDIS_DB,
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            #'PARSER_CLASS': 'redis.connection.HiredisParser',
            # A URL-safe base64-encoded 32-byte key.
            'REDIS_SECRET_KEY': "kPEDO_pSrPh3qGJVfGAflLZXKAh4AuHU64tTlP-f_PY=", # TODO load from secrets
            'SERIALIZER': 'secure_redis.serializer.SecureSerializer',
        },
        'KEY_PREFIX': 'claimantsapi:secure',
        'TIMEOUT': 60 * 15, # expire in 15 minutes TODO security requirement
    },
    'insecure': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            # "SOCKET_CONNECT_TIMEOUT": 5,  # in seconds
            "DB": REDIS_DB,
            #'PARSER_CLASS': 'redis.connection.HiredisParser',
        },
        'KEY_PREFIX': 'claimantsapi',
        'TIMEOUT': 60 * 60 * 24,  # 1 day
    },
}
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
SESSION_SAVE_EVERY_REQUEST = True # keep-alive on each request
SESSION_EXPIRY = 30 * 60 # 30 minute timeout on no requests TODO

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
#DATABASES = {"default": default_db}


# Internationalization
# https://docs.djangoproject.com/en/3.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = (
    os.path.join(BASE_DIR, 'initclaim', "build", "static"),
)

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'initclaim')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Default primary key field type
# https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# TODO limit to hosts?
CORS_ORIGIN_ALLOW_ALL = True
