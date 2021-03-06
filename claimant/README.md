# Init Claim React App

This React application is for a claimants initial UI claim filing.

## Setup

```sh
% cp .env-example .env
% make deps
% make dev-run
```

## Local development

### Faking authentication

Set the `REACT_APP_FAKE_WHOAMI` env var in your `.env` file to a JSON string per the example in `.env-example`.

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

The `DEBUG` environment variable can take different `cypress:...` values, comma-separated. See the [full list of DEBUG options](https://docs.cypress.io/guides/references/troubleshooting#Log-sources).

Alternately, you can set the base url via an environment variable:

```sh
CYPRESS_BASE_URL=https://sandbox.ui.dol.gov:3000 make test-browser
```

is the same thing as `make dev-test-browser`.

To run Cypress interactively:

```sh
% make cypress
```

To run Cypress interactively, against the dev server:

```sh
% make dev-cypress
```

To run the Jest (unit) tests:

```sh
% make test-unit
```

To run all the tests and display test coverage (assuming your Docker container is running):

```sh
% make test-coverage
```

To run unit test coverage only:

```sh
% yarn test --coverage --watchAll
```

To run all the tests and display test coverage, using the local dev server (`make dev-run`):

```sh
% make dev-test-coverage
```

### Debugging Cypress tests

Because our React app relies heavily on async communication with the backend, it's possible to discover flakey tests
due to timing issues that are environment-dependent. One handy tool for finding flakey tests in local development is
_cypress-repeat_.

```sh
% DEBUG=cypress:* npx cypress-repeat run -n 20 --headless --browser chrome --spec cypress/integration/tests/your-test.spec.js
```

The [cypress blog](https://www.cypress.io/blog/2020/12/03/retry-rerun-repeat/) has other hints on running tests.

## React Query

We are using [React Query](https://react-query.tanstack.com/) for querying and caching of data.

You will see the React Query Devtools (red flower shape) in the bottom left corner when viewing the app on port 3000 (local dev).
Clicking it will toggle the react query devtools.

(Note: While enabled on local dev, pa11y tests will fail because of its location in the dom. The tests will still pass in CI.)

## Storybook

The front-end uses [Storybook](https://storybook.js.org/) to display isolated components of the React application without the need to run the complete app. To run Storybook:

```sh
% yarn storybook
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
