#!/bin/bash
set -x
awslocal s3 mb s3://usdol-ui-claims
awslocal s3 mb s3://usdol-ui-archive
set +x
