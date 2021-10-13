# Twelve-Factor App

The [Twelve-Factor App guidelines](https://12factor.net/) define a methodology for modern web application development.
This document describes how we meet each of the 12 factors.

## I. Codebase

> One codebase tracked in revision control, many deploys

All our code is maintained in this Git repository, and we deploy it in four different DOL environments: dev, test, staging and production.

## II. Dependencies

> Explicitly declare and isolate dependencies

All our dependencies are explicitly declared in [requirements.txt](requirements.txt) (Django/Python) or [claimant/package.json](claimant/package.json) (React/JavaScript).
We specify explicit version numbers in order to prevent unexpected updates from introducing regressive bugs.

## III. Config

> Store config in the environment

We use the [django-environ](https://django-environ.readthedocs.io/en/latest/) library to manage configuration through per-environment `.env` files and environment variables.
The [core/settings.py](core/settings.py) file contains all the configuration logic for the server application.

## IV. Backing services

> Treat backing services as attached resources

We make use of serveral backing services: MySQL (RDS), Redis (ElastiCache), AWS S3, SMTP, among others.

> The code for a twelve-factor app makes no distinction between local and third party services.

All our code relies on [explicit config](core/settings.py) for attaching to service resources. For convenience,
local development uses [Docker Compose](docker-compose-services.yml) to offer production-like services via `make services-start`.

## V. Build, release, run

> Strictly separate build and run stages

Our application leverages Docker and the DOL WCMS Kubernetes infrastructure to cleanly separate the build and run stages. We build one
container image with a timestamp and Git SHA stamp, and then promote that image to different environments with different environmental configuration.
The code running in dev is identical to the code running in production. The only differences are configuration and attached resources.

## VI. Processes

> Execute the app as one or more stateless processes

Our application is stateless. All state is maintained via external attached service resources (MySQL, Redis, S3). Thus our application
can scale horizontally, by adding more processes that communicate with the same external services.

## VII. Port binding

> Export services via port binding

We explicitly expose service ports via our [Dockerfile](Dockerfile) config.

## VIII. Concurrency

> Scale out via the process model

Because we follow factor VI, we can scale with concurrent application processes. Because of limitations within the DOL deployment model,
currently we have both [web and worker processes on each node](start-server.sh), but those can be separated as the application matures.

## IX. Disposability

> Maximize robustness with fast startup and graceful shutdown

All our processes start quickly and shut down gracefully. We use Redis as a queueing storage mechanism, so that jobs that fail can be
restarted by different processes.

## X. Dev/prod parity

> Keep development, staging, and production as similar as possible

We use the same container image in all environments. We change configuration between environments only to keep keys and secrets isolated
and to scale according to usage.

## XI. Logs

> Treat logs as event streams

> A twelve-factor app never concerns itself with routing or storage of its output stream.

We log all levels of events to `stdout` and rely on the deployed environment to handle log storage and routing.

## XII. Admin processes

> Run admin/management tasks as one-off processes

We use [Django admin commands](https://docs.djangoproject.com/en/3.2/howto/custom-management-commands/) as necessary to isolate
administative tasks from the persistent worker and web processes.
