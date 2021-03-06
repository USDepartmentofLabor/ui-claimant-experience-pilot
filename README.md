# Unemployment Insurance Claimant Experience Pilot

The Department of Labor has been asked to lead the executive initiative (ARPA program) to modernize and reform Unemployment Insurance (UI). As part of this program, we are intending to use the DOL GitHub repository as a central source code repository. Following USDS playbook guidelines will help development teams to develop and deploy the code internal to DOL, share the code with respective partners (states), and also eventually make code open-source when appropriate.

## Disclaimer

The code in this repository represents the development efforts towards building an MVP application that integrates
digital identity proofing with a more modern unemployment insurance claimant intake form. This public repository
exists purely for the purposes of hosting a snapshot of code to serve as a reference for similar efforts, and is
therefore not actively maintained. Entities wishing to use this code should do standard security due diligence and make
sure to use up-to-date dependencies.

See [License](./LICENSE.md) for formal use permissions.

## ADRs

[Architectural Decision Records for this project](./docs/adr/).

## Development

This application requires:

- Python 3.x
- Node.js 14.18

Both are specified in `Dockerfile` but you will likely need both locally (natively) installed on your host machine as well.

### Setup

This documentation assumes you are developing on a Unix-like system (Linux, Mac OS).

Add these entries to your `/etc/hosts` file:

```sh
# mirror what docker does for the host machine
127.0.0.1  host.docker.internal

# dol.gov
127.0.0.1  sandbox.ui.dol.gov
```

Bootstrap your environment for the first time:

```sh
% cd path/to/this/repo
% python3 -m venv .venv
% . .venv/bin/activate
(.venv) % cp core/.env-example core/.env
(.venv) % make dev-deps
(.venv) % pre-commit install
(.venv) % make services-setup
(.venv) % make container-build
(.venv) % make services-start
```

To start a Docker container interactively and run the Django web server, run the following commands:

```sh
(.venv) % make login
```

If this is the first time setting up your environment, or if new migrations have been created or pulled into your working directory, you will need to run the following command to update your database schema:

```sh
root@randomdockerstring:/app# make migrate
```

Finally, run:

```sh
root@randomdockerstring:/app# make run
```

You can now visit http://sandbox.ui.dol.gov:8004/ (thanks to your `/etc/hosts` entries) or http://localhost:8004/.

To run the tests:

```sh
(.venv) % make login
root@randomdockerstring:/app# make test
```

#### HTTPS

In order to view an https connection locally, you will need to set up a proxy. You can use the [ssl-proxy](https://github.com/suyashkumar/ssl-proxy) tool.
You will need to install it somewhere locally in your `PATH`, and create a symlink to it called `ssl-proxy`. Then:

```sh
(.venv) % make dev-ssl-proxy
```

which will start a reverse proxy listening at https://sandbox.ui.dol.gov:4430/ and proxy to the Django server running at http://sandbox.ui.dol.gov:8004/

Like the SMTP server, the HTTPS proxy will log to stdout so start it in its own terminal window.

#### Home page and Django templates

The default home page is a static file in `home/templates/index.html`. It uses the Django templating system. It is managed separately from the React application(s).

There are additional static template files in `home/templates` that are used during the Identity Provider authentication workflow. They all share and extend
a common `base.html` template.

#### React frontend

The frontend application is found inside of `./claimant`. The `claimant` application has its own README and `make` commands.

Set up your `.env` file for the React application.

```sh
% cp claimant/.env-example claimant/.env
```

To run the React app independently of Django:

```sh
(.venv) % cd claimant
(.venv) % make deps
(.venv) % make dev-run
```

Note that because Django and React, when run independently, are listening on different ports, your browser
will consider them different domains and so cookies are not passed between them. We avoid this using the
"proxy" feature in `package.json` which should (in theory) pass cookies correctly. If you cannot run the proxy,
you may need to initiate an authenticated session first directly via Django, and then you should be able to view the authenticated
parts of the React app because your browser will send the correct session cookie to Django.

To view the React app via Django, you need to build it:

Make sure the proxy is running (`make dev-ssl-proxy`). Then:

```sh
(.venv) % cd claimant
(.venv) % make build
```

If your Django app is running, it's available at https://sandbox.ui.dol.gov:4430/claimant/.
Note that the Django-served React app is the pre-built (`NODE_ENV=production`) version and doesn't live-update as the source code is updated.

Note: you may get a "your connection is not private" warning in your browser. In Chrome, go to 'advanced' and choose to go to the site anyway.
If you get a message saying HSTS is required, it may be that another `.dol.gov` site has cached a cookie. Try clearing your browser cache and cookies.

### Using Services

Development services you can run include mysql, redis, and a development smtp server.
During local development, you can run the app dependency services with:

```sh
(.venv) % make services-start
```

View the services logs with:

```sh
(.venv) % make services-logs
```

Stop the services:

```sh
(.venv) % make services-stop
```

If you need to run the development SMTP server (does not send actual email, just logs to stdout), you can start with:

```sh
(.venv) % make smtp-server
```

NOTE that the SMTP server runs in the foreground, so start it in a dedicated terminal window. You can stop it with `Ctrl-C`.

If you ever need to connect to the Redis service directly from the terminal with the `redis-cli` tool (assuming you already have it installed),
use the make target:

```sh
(.venv) % make redis-cli
127.0.0.1:6379>
```

Connect to the MySQL server directly (assuming you have the `mysql` client already installed):

```sh
(.venv) % make mysql-cli
MySQL [unemployment]>
```

You can install both `mysql` and `redis-cli` on MacOS with Homebrew.

For localstack (AWS) services, you can use the Python `aws-cli` package:

```sh
(.venv) % pip install awscli
# to list contents of a bucket
(.venv) % aws --endpoint-url=http://localhost:4566 s3 ls s3://usdol-ui-claims
```

### Pre-commits

When using `git commit` to change or add files, the pre-commit hooks run. Some hooks such as `black` or `prettier` may modify files to enforce consistent styles. When this occurs you may see `Failed` messages and the commit may not complete. Inspect the files mentioned in the error, ensure they're correct, and retry the commit. Most editors have built-in format-on-save support for Prettier, see https://prettier.io/ .

### Internationalization (i18n)

#### Server-side

I18n for the static templates served by Django uses the built-in [Translation](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/) feature of Django.

To apply translations for simple cases, use the `{% translation <string> %}` within the template. Be sure to translate `alt` text for screen readers. The default language is English, `en`, so an `en` translation file is not necessary.
Translation messages are applied in `home/locale/<locale code>/LC_MESSAGES` in a `.po` file. After making changes to plain language in the template, in the container run:

```
make update-translations
```

This will create or update a `.po` file.

The `.po` files must be compiled into binary `.mo` files. To see your `.po` file changes locally, inside the container run:

```
make build-translations
```

This `build-translations` step is performed automatically during container build. You need to run it only during active local development
to confirm any translation changes.

#### Client-side

In React, we are using [react-i18next](https://react.i18next.com/).
Translation is found in `claimant/src/i18n` in corresponding locale directories by app page.

### Switching branches

When you switch branches locally, either because you've fetched updates from GitHub or you are developing on different features, there are some common `make` targets
you will likely want to keep in mind that help reset your local environment to something close to "fresh."

#### The .env file

When `core/.env-example` changes upstream, you will want to make sure your local `core/.env` file stays in sync with any new variables. The easiest way to do this
(assuming you have not modified your local `core/.env` file from the defaults) is:

```sh
% make dev-env-files
```

#### Rebuild your container image

If you intend to run the Django docker container locally, you'll likely need/want to rebuild it when the code changes:

```sh
% make container
```

#### Local data setup

The React app expects some data to exist on the server when you run the Cypress (browser) tests. In theory, you should only need to do this once,
not each time you switch branches, because the S3 bucket and database changes are preserved in your local services containers (mysql and localstack).
However, if your S3 bucket is deleted or your database is destroyed, you will need to re-run the test data setup.

There are two ways to create those data.

To run interactively, and preserve the test SWA keypair between containers:

```sh
% make login
doluiapp@asdfasdf:/app$ ./setup-cypress-tests.sh
```

The interactive approach should leave two files `XX-private.pem` and `XX-public.pem` in your native workspace.

To run non-interactively, and leave the keys on the container image itself (not in your native workspace):

```sh
% make container-run
# in a separate terminal window
% make container-setup-react-tests
```

## Identity Providers

Eventually, multiple Identity Providers (IdPs) will be available in the application.
The app is currently integrated with login.gov only.
Use the instructions for [login.gov sandbox setup](docs/login-dot-gov-sandbox.md).

## Security

We implement multiple layers of security checks.

For keeping up with CVEs and other outdated dependencies, you can run:

```sh
% make security
```

which will run the relevant Python and JavaScript scans. The same tools are run as part of the `make lint` `pre-commit` hooks,
but are available for running indepedently as well.

In addition, we rely on the GitHub [Dependabot](https://docs.github.com/en/code-security/supply-chain-security/managing-vulnerabilities-in-your-projects-dependencies/configuring-dependabot-security-updates)
tool to maintain dependencies.

## Data Model Migrations

Django migrations are run automatically on every deployment.

To create a new migration, start by reading the [Django documentation](https://docs.djangoproject.com/en/3.2/topics/migrations/).
These are the basic steps. Some steps require you are logged into the running Docker container with `make login`, as indicated.

- modify the appropriate `models.py` file to add a new class (table) or modify an existing class.
- within the running Docker container, create the migrations with `make migrations`
- `git add` the migration files created above (the previous step will echo the new file names to stdout on success)
- within the running Docker container, run the migrations with `make migrate`
- add tests as appropriate to the `models_tests.py` file that corresponds to the `models.py` file you modified
- within the running Docker container, run the tests with `make test`
- `git commit`

You may want to create a `schema.sql` file and `schema-erd.png` file for documenting the application data models. You can do that with:

```sh
% make schema erd
```

## SWA API Management

Each SWA model record will require a public/private key registration. To ease this in local development, there are some make commands available.

The SOP doc for [SWA Public Key Management](./docs/sop/swa-public-key-management.md) contains much of this same information,
but focused on WCMS use.

For example, create a new SWA record for Kansas in your local development area, you might do:

```sh
% make ec-keys PREFIX=KS
% make login
> make create-swa SWA=KS NAME=Kansas URL=https://kansas.gov
> make activate-swa SWA=KS
> make add-swa-key SWA=KS PEM=KS-public.pem
```

In a production environment, the SWA would create their own keys and communicate the public key PEM file to DOL via email.

You only need run `create-swa` and `activate-swa` once per environment.

To rotate a key, `add-swa-key` will, by default, refuse to overwrite any previously set public key value.
We only store one public key at a time. A SWA will want to keep private keys around after they rotate them,
in order to decrypt any Claims that were created with the older public key before we rotated it on our end.

To rotate a key, add the `ROTATE=yes` flag:

```sh
> make add-swa-key SWA=KS PEM=KS-public.pem ROTATE=yes
```

In WCMS environments you may need to upload a public key file to a running container. You can do that with the `kubectl` tool
if you have a pod identifier. Pod identifiers follow the naming pattern `arpa-ui-random-string` and you can get the list of identifiers
with `kubectl get pods`.

```sh
% kubectl cp ./KS-public.pem eta-arpa/thepodidentifier:/app/KS-public.pem
```

## Rotating symmetric encryption keys

The `CLAIM_SECRET_KEY` environment variable can hold an array of base64-encoded encryption keys. These are used to symmetrically
encrypt Claims and ClaimantFiles in our S3 bucket. The first in the array is always used for encrypting. All the keys in the array
can be used for decrypting, tried one-at-a-time until the thumbprints match.

See the [Rotating Symmetric Encryption Keys](./docs/sop/rotating-symmetric-encryption-keys.md) SOP doc for details.

## Claims and JSON schemas

The `schemas` directory contains the JSON schema definitions and example .json files for Claim and Identity.

You can use those example files (or any other valid instance) to pre-package Claim objects for SWA testing.

Example run inside the container:

```sh
> make prepackage-claim SWA=XX CLAIMANT=abc123 IDP=login.gov JSON=schemas/claim-v1.0-example.json SCHEMA=claim-v1.0
```

Valid `IDP` values include `login.gov` and (if `ENABLE_TEST_LOGIN` is active in your environment) `Local`.

## LaunchDarkly

We use [LaunchDarkly](https://launchdarkly.com/) to manage our feature flags, for both the Django server and React application.

### Django server

The `core/.env-example` file shows that setting `LD_SDK_KEY` and `LD_CLIENT_SDK_KEY` to an empty string value is allowed. The keys must be set,
but may be empty.

If you want to mimic the LD service locally, copy the `core/ld-config-test.json` file to `core/ld-config.json` and edit it. The `core/ld-config.json`
file should never be checked into git.

### React

#### Using LaunchDarkly locally

If you want to use the LaunchDarkly service while running the React development server, you will need to set the client key in the node environment. To do so, set `REACT_APP_LD_CLIENT_SDK_KEY` in `claimant/.env` the LaunchDarkly client key.

#### Mimicking the LaunchDarkly service locally

See the `claimant/.env-example file for the `REACT_APP_LD_FLAGS`environment variable. It works similarly to the local`core/ld-config.json` file but must be managed separately.

## Deployment

To build the Docker container:

```sh
% make container-build
```

The build process will install all Django and React dependencies and build the React app(s) to generate and collect all static files.

To run the container:

```sh
% make container-run
```

To open a shell in the running container (requires `make container-run` previously):

```sh
% make container-attach
```

The DOL base python image used in deployed environments requires Azure Container
Registry credentials to pull the image. Reach out to a team member for the
credentials.

To build the image as used in deployed environments (useful for testing
changes), run the following commands:

```sh
% make acr-login
% make container-build-wcms
```

## Help

Run `make` or `make help` to display a full list of available `make` commands.
