ARG BASE_PYTHON_IMAGE_REGISTRY=docker.io/library
ARG BASE_PYTHON_IMAGE_VERSION=3.9.7-slim

FROM node:14.16.0 as reactapps
WORKDIR /app

RUN apt-get update -y && apt-get install --no-install-recommends -y make

COPY claimant/Makefile ./claimant/
COPY claimant/package.json ./claimant/
COPY claimant/yarn.lock ./claimant/
COPY claimant/tsconfig.json ./claimant/
COPY claimant/.eslintrc.yml ./claimant/
# each RUN gets cached based on the COPY ahead of it, so cache the node_modules/
# unless yarn.lock has changed.
WORKDIR /app/claimant
RUN make deps

WORKDIR /app
COPY claimant/public/ ./claimant/public/
COPY claimant/src/ ./claimant/src/
WORKDIR /app/claimant
ARG ENV_NAME=""
RUN make docker-build

##########################################
# Django

FROM ${BASE_PYTHON_IMAGE_REGISTRY}/python:${BASE_PYTHON_IMAGE_VERSION} as djangobase

# Temporarily set the user to root during the docker build phase and set it
# back to a non-root user in the final stages below.
# hadolint ignore=DL3002
USER root

WORKDIR /app

# Create a non-root user and group for running the app
RUN groupadd doluiapp && \
  useradd -g doluiapp doluiapp

EXPOSE 8000

COPY requirements*.txt .

RUN apt-get update -y && apt-get install -y \
   --no-install-recommends gcc libmariadb-dev wait-for-it git make \
   && rm -rf /var/lib/apt/lists/* \
   && pip install --no-cache-dir -r requirements.txt

COPY Makefile .
COPY manage.py .
COPY start-server.sh .
COPY home ./home
COPY core ./core
COPY login-dot-gov ./login-dot-gov
COPY api ./api
COPY certs ./certs

# copy over just the precompiled react app(s)
COPY --from=reactapps /app/claimant/build /app/claimant/build
# copy USWDS static assets for Django to consume
COPY --from=reactapps /app/claimant/node_modules/uswds/dist /app/home/static

ARG APPLICATION_VERSION=""
ARG APPLICATION_TIMESTAMP=""
ENV UI_API_SHA=${APPLICATION_VERSION}
ENV BUILD_TIME=${APPLICATION_TIMESTAMP}

CMD ["./start-server.sh"]

##########################################
# for local development

FROM djangobase as djangobase-devlocal
RUN if [ -f core/.env ] ; then echo "core/.env exists" ; else cp core/.env-example core/.env ; fi && \
  pip install --no-cache-dir -r requirements-ci.txt

# leave the .env file intact
RUN make build-static && \
  rm -f core/.env-* && \
  make build-cleanup

USER doluiapp

##########################################
# for ci environment

FROM djangobase as djangobase-ci
COPY run-ci-tests.sh .
COPY setup-cypress-tests.sh .
RUN pip install --no-cache-dir -r requirements-ci.txt && \
  cp core/.env-ci core/.env && \
  echo SECRET_KEY=`make secret SECRET_LENGTH=64` >> core/.env && \
  echo REDIS_SECRET_KEY=`make secret SECRET_LENGTH=32` >> core/.env && \
  echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env

# leave the .env file intact
RUN make build-static && \
  rm -f core/.env-* && \
  make build-cleanup

USER doluiapp

##########################################
# for deployed environment

FROM djangobase as djangobase-wcms

ARG ENV_PATH=/app/core/.env-example

RUN make build-static && \
  rm -f core/.env* && \
  make build-cleanup

USER doluiapp
