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

You can now visit http://localhost:8004/ or http://sandbox.ui.dol.gov:8004/ (thanks to your `/etc/hosts` entries).

To run the tests:

```sh
(.venv) % make login
root@randomdockerstring:/app# make test
```

### Home page

The default home page is a static file in `home/templates/index.html`. In theory it can be templatized for
some dynamic rendering via the Django templating system. It is managed separately from the React application(s).

### React frontend

To run the React app independently of Django:

```sh
(.venv) % cd initclaim
(.venv) % make dev-run
```

To view the React app via Django, you need to build it:

```sh
(.venv) % cd initclaim
(.venv) % make build
```

and if your Django app is running, it's available at http://localhost:8004/initclaim

### HTTPS

If you need a https connection for testing anything locally, you can use the [ssl-proxy](https://github.com/suyashkumar/ssl-proxy) tool. You will need to install it somewhere locally in your `PATH`, and create a symlink to it called `ssl-proxy`. Then:

```sh
(.venv) % make dev-ssl-proxy
```

which will start a reverse proxy listening at https://localhost:4430/ and proxy to the Django server running at http://localhost:8004/

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


