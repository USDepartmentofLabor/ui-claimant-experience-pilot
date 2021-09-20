#!/bin/bash

# Generates x509 certificates for registering our application with an Identity Provider.

echo -n "Our app URL: "
read -r APPURL
echo -n "IdP name (URL safe): "
read -r IDPNAME

openssl req -nodes -x509 -sha256 \
  -days 365 \
  -newkey rsa:4096 \
  -keyout "certs/${IDPNAME}-private.pem" \
  -out "certs/${IDPNAME}-public.crt" \
  -subj "/C=US/ST=District of Columbia/L=Washington/O=DOL/OU=${APPURL}/CN=${IDPNAME}"

echo "Check the certs/ directory"
