#!/bin/sh

# always run from the same dir as this script
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR" || exit

make migrate
make celery-start
gunicorn core.wsgi:application --bind 0.0.0.0:8000
