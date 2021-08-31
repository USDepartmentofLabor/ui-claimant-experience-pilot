services-start:
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop:
	docker-compose -f docker-compose-services.yml down

services-logs:
	docker-compose -f docker-compose-services.yml logs -f

DEV_IMG="dolui:dev"
DEV_NAME="claimants-api-01"
PROD_IMG="dolui:prod"

dev-deps:
	pip install flake8 black

dev-build:
	docker build -f Dockerfile.dev -t $(DEV_IMG) .

dev-login:
	docker run --rm -it \
	--name $(DEV_NAME) \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DEV_IMG) /bin/bash

dev-run:
	python manage.py runserver 0:8000

dev-test-django:
	python manage.py test

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy:
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004
	
.PHONY: services-start services-stop services-logs
