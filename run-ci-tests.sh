#!/bin/bash

# exit if any command fails
set -e

# always run from the same dir as this script
SCRIPT_DIR=$(dirname "$0")
cd "$SCRIPT_DIR" || exit

# if running in WCMS env, use the same hostname as core/settings.py
if [ -z "${DB_SCHEMA}" ]; then
  RDS_HOSTNAME=rds
else
  RDS_HOSTNAME=mysql-service
fi

wait-for-it -t 60 ${RDS_HOSTNAME}:3306
wait-for-it 127.0.0.1:8000
until make celery-status
do
  echo "waiting for celery to be ready"
  sleep 1
done

# we run our own celery inside tests
make celery-stop

make migrations-check
make test

# start again for any other use of the container
make celery-start
until make celery-status
do
  echo "waiting for celery to be ready"
  sleep 1
done
