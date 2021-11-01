#!/bin/bash

set -e

# create test data for live server tests with Cypress
# this should be run before you invoke `make ci-test-react`

make bucket
make create-swa SWA=XX NAME=test
make activate-swa SWA=XX
