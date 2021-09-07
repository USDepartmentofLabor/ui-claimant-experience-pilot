services-start:
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop:
	docker-compose -f docker-compose-services.yml down

services-logs:
	docker-compose -f docker-compose-services.yml logs -f

DOCKER_IMG="dolui:claimants"
DOCKER_NAME="dolui-claimants"
# list all react frontend apps here, space delimited
REACT_APPS = initclaim

ci-start:
	docker-compose -f docker-compose-services.yml -f docker-compose-ci.yml up -d

ci-stop:
	docker-compose -f docker-compose-services.yml -f docker-compose-ci.yml down

ci-tests:
	docker exec web make test

dev-deps:
	pip install flake8 black

container-build:
	docker build -f Dockerfile -t $(DOCKER_IMG) .

container-run:
	docker run -it -p 8004:8000 $(DOCKER_IMG)

# intended to be run inside the docker container during container-build
build-static:
	rm -rf static/
	mkdir static
	python manage.py collectstatic

login:
	docker run --rm -it \
	--name $(DOCKER_NAME) \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DOCKER_IMG) /bin/bash

dev-run:
	python manage.py runserver 0:8000

test-django:
	coverage run manage.py test --pattern="*tests*py"
	coverage report -m --skip-covered --fail-under 90

test: test-django

list-outdated:
	pip list --outdated

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy:
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004

react-deps:
	for reactapp in $(REACT_APPS); do cd $$reactapp && make deps ; done

react-build:
	for reactapp in $(REACT_APPS); do cd $$reactapp && make build ; done

.PHONY: services-start services-stop services-logs
