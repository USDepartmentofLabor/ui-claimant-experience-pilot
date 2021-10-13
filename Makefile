help: ## Print the help documentation
	@grep -E '^[/a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

services-start: ## Start Django app's supporting services
	docker-compose -f docker-compose-services.yml up -d --remove-orphans

services-stop: ## Stop Django app's supporting services
	docker-compose -f docker-compose-services.yml down

services-logs: ## Show logs for Django app's supporting services
	docker-compose -f docker-compose-services.yml logs -f

services-setup: ## Create dependency files for supporting services
	bash scripts/gen-redis-certs.sh

services-clean: ## Clean up dependencies
	rm -f certs/redis*

redis-cli: ## Connect to Redis service with redis-cli
	redis-cli --tls --cacert certs/redisCA.crt --cert certs/redis-client.crt --key certs/redis-client.key

mysql-cli: ## Connect to the MySQL server
	mysql -h 127.0.0.1 -u user -psecret -D unemployment

DOCKER_IMG="dolui:claimants"
DOCKER_NAME="dolui-claimants"
ifeq (, $(shell which docker))
DOCKER_CONTAINER_ID := docker-is-not-installed
else
DOCKER_CONTAINER_ID := $(shell docker ps --filter ancestor=$(DOCKER_IMG) --format "{{.ID}}" -a)
endif
# list all react frontend apps here, space delimited
REACT_APPS = claimant
CI_ENV_FILE=core/.env-ci
CI_SERVICES=-f docker-compose-services.yml
CI_DOCKER_COMPOSE_OPTS=--env-file=$(CI_ENV_FILE) -f docker-compose-ci.yml
CI_OPTS=$(CI_SERVICES) $(CI_DOCKER_COMPOSE_OPTS)

ci-build:  ## Build the docker images for CI
	docker-compose $(CI_OPTS) build

ci-start: services-setup ## Start Django app's supporting services (in CI)
	docker-compose $(CI_OPTS) up -d --no-recreate

ci-stop: ## Stop Django app's supporting services (in CI)
	docker-compose $(CI_OPTS) down

ci-tests: ## Run Django app tests in Docker
	docker-compose $(CI_OPTS) logs --tail="all"
	docker exec web ./run-ci-tests.sh

ci-test: ci-tests ## Alias for ci-tests

ci-clean: ## Remove all the CI service images (including those in docker-compose-services)
	docker-compose $(CI_OPTS) down --rmi all

lint-check: ## Run lint check
	pre-commit run --all-files

lint-fix: ## Fix lint-checking issues
	black .
	for reactapp in $(REACT_APPS); do cd $$reactapp && make lint-fix ; done

lint: lint-check lint-fix ## Lint the code

dockerlint-run: ## Run redcoolbeans/dockerlint
	docker run --rm -v "$(PWD)/Dockerfile":/Dockerfile:ro redcoolbeans/dockerlint:0.3.1

migrate: ## Run Django data model migrations (inside container)
	python manage.py migrate

# this runs 2 workers named w1 and w2. Each worker will have N child prefork processes,
# by default the number of cores on the machine. See
# http://docs.celeryq.org/en/latest/getting-started/next-steps.html#starting-the-worker
# By default logs are written to /var/log/celery
CELERY_OPTS = w1 -c 2 -A core -l info
celery-start: ## Run the celery queue manager (inside container)
	celery multi start $(CELERY_OPTS)

celery-restart: ## Restart the celery queue manager (inside container)
	celery multi restart $(CELERY_OPTS)

celery-stop: ## Stop the celery queue manager (inside container)
	celery multi stopwait $(CELERY_OPTS)

celery-status: ## Display status of celery worker(s) (inside the container)
	celery -A core status

dev-deps: ## Install local development environment dependencies
	pip install pre-commit black bandit safety

dev-env-files: ## Reset local env files based on .env-example files
	cp ./core/.env-example ./core/.env
	cp ./claimant/.env-example ./claimant/.env

container-build: ## Build the Django app container image
	docker build -f Dockerfile -t $(DOCKER_IMG) --target djangobase-devlocal .

container-run: ## Run the Django app in Docker
	docker run -it -p 8004:8000 $(DOCKER_IMG)

container-stop: ## Stop the Django app container with DOCKER_CONTAINER_ID
	docker stop $(DOCKER_CONTAINER_ID)

container-rm: ## Remove the Django app container with DOCKER_CONTAINER_ID
	docker rm $(DOCKER_CONTAINER_ID)

container-clean: ## Remove the Django app container image
	docker image rm $(DOCKER_IMG)

container: container-clean container-build ## Alias for container-clean container-build

SECRET_LENGTH := 32
secret: ## Generate string for SECRET_KEY or REDIS_SECRET_KEY env variable
	@python -c "import secrets; import base64; print(base64.urlsafe_b64encode(secrets.token_bytes($(SECRET_LENGTH))).decode('utf-8'))"

x509-certs: ## Generate x509 public/private certs for registrying with Identity Provider
	scripts/gen-x509-certs.sh

# this env var just so that settings.py can determine how it was invoked
build-static: export BUILD_STATIC=true
build-static: ## Build the static assets (intended for during container-build (inside the container))
	rm -rf static/
	rm -f home/static/*.md
	mkdir static
	python manage.py collectstatic
	cp home/templates/favicon.ico static/
	cp home/templates/sureroute-test-object.html static/

# the --mount option ignores the local build dir for what is on the image
login: ## Log into the Django app docker container
	docker run --rm -it \
	--name $(DOCKER_NAME) \
	--mount type=volume,dst=/app/claimant/build \
	-v $(PWD):/app \
	-p 8004:8000 \
	$(DOCKER_IMG) /bin/bash

container-attach: ## Attach to a running container and open a shell (like login for running container)
	docker exec -it $(DOCKER_CONTAINER_ID) /bin/bash

dev-run: ## Run the Django app, tracking changes
	python manage.py runserver 0:8000

run: ## Run the Django app, without tracking changes
	python manage.py runserver 0:8000 --noreload

shell: ## Open interactive Django shell (run inside container)
	python manage.py shell

# important! this env var must be set to trigger the correct key/config generation.
test-django: export LOGIN_DOT_GOV_ENV=test
test-django: ## Run Django app tests
	coverage run manage.py test -v 2 --pattern="*tests*py"
	coverage report -m --skip-covered --fail-under 90
	coverage xml --fail-under 90

test-react: ## Run React tests
	for reactapp in $(REACT_APPS); do cd $$reactapp && make test ; done

test: test-django ## Run tests (must be run within Django app docker container)

list-outdated: ## List outdated dependencies
	pip list --outdated
	for reactapp in $(REACT_APPS); do cd $$reactapp && make list-outdated ; done

# https://github.com/suyashkumar/ssl-proxy
dev-ssl-proxy: ## Run ssl-proxy
	ssl-proxy -from 0.0.0.0:4430 -to 127.0.0.1:8004

smtp-server: ## Starts the debugging SMTP server
	python -m smtpd -n -c DebuggingServer 0.0.0.0:1025

react-deps: ## Install React app dependencies
	for reactapp in $(REACT_APPS); do cd $$reactapp && make deps ; done

react-build: ## Build the React apps
	for reactapp in $(REACT_APPS); do cd $$reactapp && make build ; done

security: ## Run all security scans
	bandit -x ./.venv -r .
	safety check
	for reactapp in $(REACT_APPS); do cd $$reactapp && make security; done

diff-test: ## Fails if there are any local changes, using git diff
	@changed_files=`git diff --name-only`; if [ "$$changed_files" != "" ]; then echo "Local changes exist:\n$$changed_files" && exit 1; fi

default: help

.PHONY: services-start services-stop services-logs ci-start ci-stop
