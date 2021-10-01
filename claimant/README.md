# Init Claim React App

This React application is for a claimants initial UI claim filing.

## Setup

```sh
% cp .env-example .env
% make deps
% make dev-run
```

## Local development

### Tests

If you want to run the Cypress tests, the Docker container must be running with the Django server.
However, you can run the Cypress tests against either the built app (port 4430) or the npm dev server (port 3000).

For the built app (as it runs tests in CI):

```sh
% make test-browser
```

For the dev server (local only):

```sh
% make dev-test-browser
```

To run an individual test from the terminal:

```sh
% npx cypress run --headless --browser chrome --spec cypress/integration/tests/name-of-your-test
```

To turn on all the verbose Cypress debugging for one test against your dev server:

```sh
DEBUG=cypress:* npx cypress run --headless --browser chrome --spec cypress/integration/tests/name-of-your-test -c baseUrl=https://sandbox.ui.dol.gov:3000
```

Alternately, you can set the base url via an environment variable:

```sh
CYPRESS_BASE_URL=https://sandbox.ui.dol.gov:3000 make test-browser
```

is the same thing as `make dev-test-browser`.

To run Cypress interactively:

```sh
% make cypress
```

To run the Jest (unit) tests:

```sh
% make test-unit
```

## Build

```sh
% make build
```

## Layout

The `src/` directory is laid out like this.

### `App.js`

Main application file.

### `pages/`

Individual page components. See `routes.js`.

### `hoc/`

Higher order components. See [React docs](https://reactjs.org/docs/higher-order-components.html) for details.

### `utils/`

Utility code.
