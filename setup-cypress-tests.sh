#!/bin/bash

# create test data for live server tests with Cypress
# this should be run before you invoke `make ci-test-react`

make bucket
make dol-bucket
make create-swa SWA=XX NAME=test && \
make activate-swa SWA=XX && \
make ec-keys PREFIX=XX PASSWD=secret && \
make add-swa-key SWA=XX PEM=XX-public.pem
