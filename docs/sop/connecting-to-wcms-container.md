# Connecting to a WCMS container

The WCMS Kubernetes environment requires use of the `kubectl` command. Details on installation/configuration are available from the WCMS team.

This document describes common `kubectl` commands useful for administrative tasks.

## Set the WCMS environment context

Our environments are named:

- `dev02`
- `test02`
- `stage01`
- TODO prod

To set the environment for the current Windows shell:

```sh
kubectl config use-context ocio-wcms-ENVNAME-eks
```

For the `dev02` environment, for example:

```sh
> kubectl config use-context ocio-wcms-dev02-eks
```

All subsequent `kubectl` commands will use the current context, until you change it.

## List all pods in an environment

To list all the pods in a environment context:

```sh
> kubectl get pods -o wide
```

## Tail all the logs in an environment

To tail all the running pods:

```sh
> kubectl logs -f --selector app=arpa-ui
```

## Connect to a running container with bash

First, get a pod identifier by [listing all the pods](#list-all-pods-in-an-environment). The identifiers
are the first `NAME` column and typically start with `arpa-ui-`. You only need one them. Any one will do.
These identifiers change on every deployment.

Second, execute the bash command on one of the pods:

```sh
> kubectl exec -it :podidentifier: -- bash
```
