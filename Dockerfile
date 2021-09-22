ARG ENV_NAME

FROM node:14.16.0 as reactapps
WORKDIR /app

RUN apt-get update -y && apt-get install --no-install-recommends -y make

COPY Makefile .

# TODO figure out a better way to maintain a list of all react apps in one place
COPY initclaim/Makefile ./initclaim/
COPY initclaim/package.json ./initclaim/
COPY initclaim/yarn.lock ./initclaim/
COPY initclaim/tsconfig.json ./initclaim/
COPY initclaim/.eslintrc.yml ./initclaim/
# each RUN gets cached based on the COPY ahead of it, so cache the node_modules/
# unless yarn.lock has changed.
RUN make react-deps

COPY initclaim/public/ ./initclaim/public/
COPY initclaim/src/ ./initclaim/src/
# TODO build initclaim/.env here?
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
COPY --from=reactapps /app/initclaim/build /app/initclaim/build

# we define multiple base layers with ENV_NAME as a suffix, then pick one based on ARG.
FROM djangobase as djangobase-ci
RUN echo "ENV_NAME=ci"
# leave .env-ci intact for tests to run
ARG ENV_CLEANUP=core/.env-example
RUN pip install --no-cache-dir -r requirements-ci.txt

FROM djangobase as djangobase-wcms
RUN echo "ENV_NAME=wcms"
# leave the .env file intact
ARG ENV_CLEANUP=core/.env-*
# TODO create an actual .env-wcms if we need special build-time vars
RUN cp core/.env-example core/.env-wcms && \
  echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env

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
  apt-get purge -y --auto-remove gcc

CMD ["./start-server.sh"]
