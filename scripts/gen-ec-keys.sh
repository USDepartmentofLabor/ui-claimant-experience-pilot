#!/bin/bash

set -e

PREFIX=$1

if [ -z "$PREFIX" ]; then
  PREFIX="ec"
fi

echo "Private key password: "
read -r -s PASSWD
echo

PRIVATE_KEY="${PREFIX}-private.pem"
PUBLIC_KEY="${PREFIX}-public.pem"

openssl ecparam -genkey -name P-256 | openssl ec -aes256 -out "${PRIVATE_KEY}" -passout pass:"$PASSWD"
openssl ec -in "${PRIVATE_KEY}" -passin pass:"$PASSWD" -pubout -out "${PUBLIC_KEY}"
