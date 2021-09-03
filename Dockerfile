FROM node:14.16.0 as reactapps
WORKDIR /app

RUN apt-get update -y && apt-get install -y make

COPY Makefile .

# TODO figure out a better way to maintain a list of all react apps in one place
COPY initclaim/Makefile ./initclaim/
COPY initclaim/package.json ./initclaim/
COPY initclaim/yarn.lock ./initclaim/
# each RUN gets cached based on the COPY ahead of it, so cache the node_modules/
# unless yarn.lock has changed.
RUN make react-deps

COPY initclaim/public/ ./initclaim/public/
COPY initclaim/src/ ./initclaim/src/
# TODO build initclaim/.env here?
RUN make react-build


FROM python:3.9
WORKDIR /app

COPY requirements.txt .

RUN apt-get update -y && apt-get install -y \
   --no-install-recommends gcc libmariadb-dev \
   && rm -rf /var/lib/apt/lists/* \
   && pip install -r requirements.txt \
   && apt-get purge -y --auto-remove gcc

COPY Makefile .
COPY manage.py .
COPY start-server.sh .
COPY home ./home
COPY core ./core

# copy over just the precompiled react app(s)
COPY --from=reactapps /app/initclaim/build /app/initclaim/build

RUN make build-static

EXPOSE 8000

CMD ["./start-server.sh"]
