# ARPAUI

The Department of Labor has been asked to lead the executive initiative (ARPA program) to modernize and reform Unemployment Insurance (UI). As part of this program, we are intending to use the DOL GitHub repository as a central source code repository. Following USDS playbook guidelines will help development teams to develop and deploy the code internal to DOL, share the code with respective partners (states), and also eventually make code open-source when appropriate.

## ADRs

[Architectural Decision Records for this project](./docs/adr/).

## Development

This Django application requires:

* Python 3.x

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
(.venv) % make container-build
```

To log into the Docker container interactively and run the Django web server:

```sh
(.venv) % make login
root@randomdockerstring:/app# make dev-run
```

You can now visit http://sandbox.ui.dol.gov:8004/ (thanks to your `/etc/hosts` entries) or http://localhost:8004/.

To run the tests:

```sh
(.venv) % make login
root@randomdockerstring:/app# make test
```

### Home page

The default home page is a static file in `home/templates/index.html`. In theory it can be templatized for
some dynamic rendering via the Django templating system. It is managed separately from the React application(s).

### React frontend

Set up your `.env` file for each React application.

```sh
% cp initclaim/.env-example initclaim/.env
```

To run the React app independently of Django:

```sh
(.venv) % cd initclaim
(.venv) % make dev-run
```

Note that because Django and React, when run independently, are listening on different ports, your browser
will consider them different domains and so cookies are not passed between them. We avoid this using the
"proxy" feature in `package.json` which should (in theory) pass cookies correctly. If you cannot run the proxy,
you may need to initiate an authenticated session first directly via Django, and then you should be able to view the authenticated
parts of the React app because your browser will send the correct session cookie to Django.

To view the React app via Django, you need to build it:

```sh
(.venv) % cd initclaim
(.venv) % make build
```

and if your Django app is running, it's available at http://sandbox.ui.dol.gov:8004/initclaim/.

### HTTPS

If you need a https connection for testing anything locally, you can use the [ssl-proxy](https://github.com/suyashkumar/ssl-proxy) tool.
You will need to install it somewhere locally in your `PATH`, and create a symlink to it called `ssl-proxy`. Then:

```sh
(.venv) % make dev-ssl-proxy
```

which will start a reverse proxy listening at https://sandbox.ui.dol.gov:4430/ and proxy to the Django server running at http://sandbox.ui.dol.gov:8004/

## Identity Providers

Eventually, multiple Identity Providers (IdPs) will be available in the application.

For development and testing, the [login.gov sandbox](https://idp.int.identitysandbox.gov/) is available to anyone.
Your account can be added to the [ARPA UI claimant application](https://dashboard.int.identitysandbox.gov/)
via an existing team member with a .gov or .mil email address.
To use the AAL2/IAL2 flow locally, you will need the private cert, also available from an existing team member.

### Testing the login.gov sandbox integration

If you are running the application locally, you can test out the complete IdP integration.

* Copy the `logindotgov-private.pem` file to the root path of the repo. It should *not* be checked into Git.
* Your local server should be listening at https://sandbox.ui.dol.gov:4430/. If not, check out the sections above on HTTPS and running the Django
app via `make login`.
* Visit https://sandbox.ui.dol.gov:4430/logindotgov/
* Sign in or Create an account, depending on whether you already have a sandbox account
* Walk through the IAL2 proofing flow (should only need to do this if you are creating an account for the first time).
See https://developers.login.gov/testing/#testing-ial2 for details.
* On successful IAL2 validation, you should be redirected to https://sandbox.ui.dol.gov:4430/logindotgov/explain where you can see all the attributes
that login.gov asserts to our application.

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

## Help

Run `make` or `make help` to display a full list of available `make` commands.
