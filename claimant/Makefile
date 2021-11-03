help: ## Print the help documentation
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

docker-build: ## Build the app based on ENV_NAME env var (run inside Docker container)
ifeq ($(ENV_NAME), ci)
	make instrumented-build
else ifeq ($(ENV_NAME), devlocal)
	make instrumented-build
else
	make build
endif

build: ## Build the app
	yarn build

instrumented-build: ## Build the app for CI (includes Cypress instrumentation for coverage)
	yarn build:instrumented

dev-run: node_modules ## Run the app
	yarn start

deps node_modules: ## Install dependencies
	yarn install

clean: ## Delete the build/ directory
	rm -rf build

lint-check: ## Run lint checker
	npx eslint .

lint-fix: ## Fix linting issues
	npx eslint --fix .

lint: lint-check lint-fix ## Run all the lint targets (i.e. make lint-check lint-fix)

test-unit: ## Run all unit tests
	yarn test --watchAll=false --testURL https://sandbox.ui.dol.gov:4430/claimant

test-browser: ## Run browser (cypress) tests
	npx cypress run --headless --browser chrome

dev-test-browser: ## Run browser tests against local dev server (port 3000)
	npx cypress run --headless --browser chrome --config-file cypress-dev.json

cypress: ## Start the Cypress interactive application
	npx cypress open

test: test-unit ## Run all unit tests

ci-tests: ## Run CI tests
	yarn test:ci

test-coverage: ## Run all tests and display coverage
	yarn test:coverage

dev-test-coverage: ## Run all tests and display coverage against local dev server (port 3000)
	yarn pretest:coverage
	yarn coverage
	yarn cypress:run:dev
	yarn posttest:coverage

security: ## Run security scans
	@echo "yarn audit disabled"
	# https://overreacted.io/npm-audit-broken-by-design/
	# yarn audit

list-outdated: ## List outdated dependencies
	npx retire

default: help

.PHONY: build dev-run deps clean lint-check lint-fix lint cypress
