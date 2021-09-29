ARG ENV_NAME

FROM node:14.16.0 as reactapps
WORKDIR /app

RUN apt-get update -y && apt-get install --no-install-recommends -y make

COPY Makefile .

COPY claimant/Makefile ./claimant/
COPY claimant/package.json ./claimant/
COPY claimant/yarn.lock ./claimant/
COPY claimant/tsconfig.json ./claimant/
COPY claimant/.eslintrc.yml ./claimant/
# each RUN gets cached based on the COPY ahead of it, so cache the node_modules/
# unless yarn.lock has changed.
RUN make react-deps

COPY claimant/public/ ./claimant/public/
COPY claimant/src/ ./claimant/src/
RUN make react-build

##########################################
# Django

FROM python:3.9 as djangobase
WORKDIR /app
EXPOSE 8000

COPY requirements*.txt .

RUN apt-get update -y && apt-get install -y \
   --no-install-recommends gcc libmariadb-dev wait-for-it \
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

# we define multiple base layers with ENV_NAME as a suffix, then pick one based on ARG.
FROM djangobase as djangobase-ci
RUN echo "ENV_NAME=ci"
# leave .env-ci intact for tests to run
ARG ENV_CLEANUP=core/.env-example
RUN pip install --no-cache-dir -r requirements-ci.txt && \
  echo SECRET_KEY=`make secret SECRET_LENGTH=64` >> core/.env-ci && \
  echo REDIS_SECRET_KEY=`make secret SECRET_LENGTH=32` >> core/.env-ci && \
  echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env-ci

FROM djangobase as djangobase-wcms
RUN echo "ENV_NAME=wcms"
# leave the .env file intact
ARG ENV_CLEANUP=core/.env-*
# TODO create an actual .env-wcms if we need special build-time vars
RUN cp core/.env-example core/.env-wcms && \
  echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env
# TODO remove this before we go to staging
ENV DEBUG=true

FROM djangobase as djangobase-
ARG ENV_CLEANUP=core/.env-*
RUN echo "ENV_NAME build-arg is undefined" && \
  if [ -f core/.env ] ; then echo "core/.env exists" ; else cp core/.env-example core/.env ; fi && \
  pip install --no-cache-dir -r requirements-ci.txt

# pick the layer to run env-specific tasks within.
# linter exception here because we include a variable in the name.
# hadolint ignore=DL3006
FROM djangobase-${ENV_NAME} as django-final
# invoke inside the FROM scope so that make build-static gets it as an env var.
ARG ENV_NAME

# collects all the static assets, including react apps, into the /static dir
RUN make build-static

ARG ENV_CLEANUP
RUN rm -f ${ENV_CLEANUP} && \
  rm -f requirements*.txt && \
  apt-get purge -y --auto-remove gcc

CMD ["./start-server.sh"]
