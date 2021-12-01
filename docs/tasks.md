# Background Tasks

We use [Celery](https://docs.celeryproject.org/en/stable/index.html) to manage and run background asynchronous
tasks. Examples include sending email, making 3rd party API requests, or any other code that might require more time
or re-try capability outside the normal HTTP request/response cycle.

This document describes how we approach using Celery.

## Commands

The most common `celery` commands are supported in our `Makefile`. These include starting/stopping the daemon,
watching the logs, and checking status. See the [Celery documentation](https://docs.celeryproject.org/en/stable/userguide/monitoring.html)
for all the supported commands/options.

All these commands are expected to run inside the container, just like Django.

### make celery-start

Starts the `celery` daemon. We currently run one parent worker (manager) with two concurrent prefork child workers.

### make celery-stop

Stop the `celery` daemon.

### make celery-restart

Just like running `make celery-stop celery-start`.

### make celery-touch-logs

Runs a `touch` command on every log file we expect `celery` to create. This allows `make celery-watch-logs` to work as expected.
See the `start-server.sh` script.

### make celery-watch-logs

Runs a `tail -F` command on all the `celery` logs. We do this so that `celery` log output appears on stdout along with the Django
server output, following the 12-factor app approach.

### make celery-status

Returns the status of the `celery` daemon. Used to verify that the daemon is ready to receive tasks (jobs).
