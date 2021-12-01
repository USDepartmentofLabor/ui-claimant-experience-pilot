#!/bin/bash

# exit if any command fails
set -e

# always run from the same dir as this script
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR" || exit

make migrate
make celery-start
until make celery-status
do
  echo "waiting for celery to be ready"
  sleep 1
done
make celery-touch-logs
make celery-watch-logs &
gunicorn core.wsgi:application --bind 0.0.0.0:8000
