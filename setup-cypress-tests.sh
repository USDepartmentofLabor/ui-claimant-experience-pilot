#!/bin/bash

# create test data for live server tests with Cypress
# this should be run before you invoke `make ci-test-react`

make bucket
make dol-bucket
## the XX SWA has featureset CLAIM_AND_IDENTITY (the default)
make create-swa SWA=XX NAME=test URL=https://xx.example.gov/ && \
make activate-swa SWA=XX && \
make ec-keys PREFIX=XX PASSWD=secret && \
make add-swa-key SWA=XX PEM=XX-public.pem

## the YY SWA has featureset IDENTITY_ONLY
make create-swa SWA=YY NAME='identity-only-test' URL=https://yy.example.gov/ FEATURESET=2 && \
make activate-swa SWA=YY && \
make ec-keys PREFIX=YY PASSWD=secret && \
make add-swa-key SWA=YY PEM=YY-public.pem
