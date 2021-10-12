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
# copy USWDS static assets for Django to consume
COPY --from=reactapps /app/claimant/node_modules/uswds/dist /app/home/static

CMD ["./start-server.sh"]

##########################################
# for local development

FROM djangobase as djangobase-devlocal
RUN if [ -f core/.env ] ; then echo "core/.env exists" ; else cp core/.env-example core/.env ; fi && \
  pip install --no-cache-dir -r requirements-ci.txt

# leave the .env file intact
RUN make build-static && \
  rm -f core/.env-* && \
  rm -f requirements*.txt && \
  apt-get purge -y --auto-remove gcc

##########################################
# for ci environment

FROM djangobase as djangobase-ci
COPY run-ci-tests.sh .
RUN pip install --no-cache-dir -r requirements-ci.txt && \
  cp core/.env-ci core/.env && \
  echo SECRET_KEY=`make secret SECRET_LENGTH=64` >> core/.env && \
  echo REDIS_SECRET_KEY=`make secret SECRET_LENGTH=32` >> core/.env && \
  echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env

# leave the .env file intact
RUN make build-static && \
  rm -f core/.env-* && \
  rm -f requirements*.txt && \
  apt-get purge -y --auto-remove gcc

##########################################
# for deployed environment

FROM djangobase as djangobase-wcms
RUN echo "BUILD_TIME=`date '+%Y%m%d-%H%M%S'`" >> core/.env

ARG ENV_PATH=/app/core/.env-example

# leave the .env file intact
RUN make build-static && \
  rm -f core/.env-* && \
  rm -f requirements*.txt && \
  apt-get purge -y --auto-remove gcc
