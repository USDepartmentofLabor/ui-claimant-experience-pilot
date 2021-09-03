FROM node:14.16.0 as reactapps
WORKDIR /app

RUN apt-get update -y && apt-get install -y make

COPY Makefile .
# TODO figure out a better way to maintain a list of all react apps in one place
COPY initclaim ./initclaim
RUN make react-deps
RUN make react-build

FROM python:3.9
WORKDIR /app

COPY requirements.txt .

RUN apt-get update -y && apt-get install -y \
   --no-install-recommends gcc libmariadb-dev \
   && rm -rf /var/lib/apt/lists/* \
   && pip install -r requirements.txt \
   && apt-get purge -y --auto-remove gcc

COPY manage.py .
COPY start-server.sh .
COPY home ./home
COPY core ./core

COPY --from=reactapps /app /app

RUN make build-static

EXPOSE 8000

CMD ["./start-server.sh"]
