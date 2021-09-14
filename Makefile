help: ## Print the help documentation
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

services-start: ## Start Django app's supporting services
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop: ## Stop Django app's supporting services
	docker-compose -f docker-compose-services.yml down

services-logs: ## Show logs for Django app's supporting services
	docker-compose -f docker-compose-services.yml logs -f

DOCKER_IMG="dolui:claimants"
DOCKER_NAME="dolui-claimants"
# list all react frontend apps here, space delimited
REACT_APPS = initclaim
CI_ENV_FILE=core/.env-ci
CI_DOCKER_COMPOSE_OPTS=--env-file=$(CI_ENV_FILE) -f docker-compose-services.yml -f docker-compose-ci.yml

ci-build:  ## Build the docker images for CI
	docker-compose $(CI_DOCKER_COMPOSE_OPTS) build

ci-start: ## Start Django app's supporting services (in CI)
	docker-compose $(CI_DOCKER_COMPOSE_OPTS) up -d

ci-stop: ## Stop Django app's supporting services (in CI)
	docker-compose $(CI_DOCKER_COMPOSE_OPTS) down

ci-tests: ## Run Django app tests in Docker
	docker exec --env-file=$(CI_ENV_FILE) web make test

ci-test: ci-tests ## Alias for ci-tests

ci-clean: ## Remove all the CI service images (including those in docker-compose-services)
	docker-compose $(CI_DOCKER_COMPOSE_OPTS) down --rmi all

lint-check: ## Run lint check
	pre-commit run --all-files

lint-fix: ## Fix lint-checking issues
	black .
	for reactapp in $(REACT_APPS); do cd $$reactapp && make lint-fix ; done

lint: lint-check lint-fix ## Lint the code

dev-deps: ## Install local development environment dependencies
	pip install pre-commit black bandit safety

container-build: ## Build the Django app container image
	docker build -f Dockerfile -t $(DOCKER_IMG) .

container-run: ## Run the Django app in Docker
	docker run -it -p 8004:8000 $(DOCKER_IMG)

container: container-build ## Alias for container-build

# important! this env var must be set to trigger the correct key/config generation.
build-static: export LOGIN_DOT_GOV_ENV=test
build-static: ## Build the static assets (intended for during container-build (inside the container))
	rm -rf static/
	mkdir static
	python manage.py collectstatic

login: ## Log into the Django app docker container
	docker run --rm -it \
	--name $(DOCKER_NAME) \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DOCKER_IMG) /bin/bash

dev-run: ## Run the Django app, tracking changes
	python manage.py runserver 0:8000

run: ## Run the Django app, without tracking changes
	python manage.py runserver 0:8000 --noreload

# important! this env var must be set to trigger the correct key/config generation.
test-django: export LOGIN_DOT_GOV_ENV=test
test-django: ## Run Django app tests
	coverage run manage.py test --pattern="*tests*py"
	coverage report -m --skip-covered --fail-under 90

test-react: ## Run React tests
	for reactapp in $(REACT_APPS); do cd $$reactapp && make test ; done

test: test-django ## Run tests (must be run within Django app docker container)

list-outdated: ## List outdated dependencies
	pip list --outdated
	for reactapp in $(REACT_APPS); do cd $$reactapp && make list-outdated ; done

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy: ## Run ssl-proxy
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004

react-deps: ## Install React app dependencies
	for reactapp in $(REACT_APPS); do cd $$reactapp && make deps ; done

react-build: ## Build the React apps
	for reactapp in $(REACT_APPS); do cd $$reactapp && make build ; done

security: ## Run all security scans
	bandit -x ./.venv -r . -s B105
	safety check
	for reactapp in $(REACT_APPS); do cd $$reactapp && make security; done

default: help

.PHONY: services-start services-stop services-logs
