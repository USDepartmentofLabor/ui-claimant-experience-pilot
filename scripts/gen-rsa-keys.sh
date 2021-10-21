#!/bin/bash

PREFIX=$1

if [ -z "$PREFIX" ]; then
  PREFIX="rsa"
fi

echo -n "Private key password: "
read -r -s PASSWD
echo

openssl genrsa -aes256 -passout pass:"$PASSWD" -out "${PREFIX}-private.pem" 4096
openssl rsa -in "${PREFIX}-private.pem" -passin pass:"$PASSWD" -pubout -out "${PREFIX}-public.pem"
