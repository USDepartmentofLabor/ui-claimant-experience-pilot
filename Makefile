help:  ## Print the help documentation
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

services-start:  ## Start Django app's supporting services
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop:  ## Stop Django app's supporting services
	docker-compose -f docker-compose-services.yml down

services-logs:  ## Show logs for Django app's supporting services
	docker-compose -f docker-compose-services.yml logs -f

DOCKER_IMG="dolui:claimants"
DOCKER_NAME="dolui-claimants"
# list all react frontend apps here, space delimited
REACT_APPS = initclaim

ci-start:  ## Start Django app's supporting services (in CI)
	docker-compose -f docker-compose-services.yml -f docker-compose-ci.yml up -d

ci-stop:  ## Stop Django app's supporting services (in CI)
	docker-compose -f docker-compose-services.yml -f docker-compose-ci.yml down

ci-tests:  ## Run Django app tests in Docker
	docker exec web make test

lint-check:  ## Run lint check
	pre-commit run --all-files

lint-fix:  ## Fix lint-checking issues
	black .
	for reactapp in $(REACT_APPS); do cd $$reactapp && make lint-fix ; done

lint: lint-check lint-fix  ## Lint the code

dev-deps:  ## Install local development environment dependencies
	pip install pre-commit black

container-build:  ## Build the Django app container image
	docker build -f Dockerfile -t $(DOCKER_IMG) .

container-run:  ## Run the Django app in Docker
	docker run -it -p 8004:8000 $(DOCKER_IMG)

build-static:  ## Build the static assets (intended for during container-build)
	rm -rf static/
	mkdir static
	python manage.py collectstatic

login:  ## Log into the Django app docker container
	docker run --rm -it \
	--name $(DOCKER_NAME) \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DOCKER_IMG) /bin/bash

dev-run:  ## Run the Django app
	python manage.py runserver 0:8000

test-django:  ## Run Django app tests
	coverage run manage.py test --pattern="*tests*py"
	coverage report -m --skip-covered --fail-under 90

test: test-django  ## Run tests (must be run within Django app docker container)

list-outdated:  ## List outdated python dependencies
	pip list --outdated

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy:  ## Run ssl-proxy
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004

react-deps:  ## Install React app dependencies
	for reactapp in $(REACT_APPS); do cd $$reactapp && make deps ; done

react-build:  ## Build the React apps
	for reactapp in $(REACT_APPS); do cd $$reactapp && make build ; done

default: help

.PHONY: services-start services-stop services-logs
