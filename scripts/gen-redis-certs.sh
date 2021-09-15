#!/bin/bash

# original: https://stackoverflow.com/a/67609012
# COPIED/MODIFIED from the redis server gen-certs util

# Generate some test certificates which are used by the regression test suite:
#
#   certs/ca.{crt,key}          Self signed CA certificate.
#   certs/redis.{crt,key}       A certificate with no key usage/policy restrictions.
#   certs/client.{crt,key}      A certificate restricted for SSL client usage.
#   certs/server.{crt,key}      A certificate restricted for SSL server usage.
#   certs/redis.dh              DH Params file.

generate_cert() {
    local name=$1
    local cn="$2"
    local opts="$3"

    local keyfile=certs/${name}.key
    local certfile=certs/${name}.crt

    [ -f "$keyfile" ] || openssl genrsa -out "$keyfile" 2048
    # shellcheck disable=SC2086
    openssl req \
        -new -sha256 \
        -subj "/O=Redis Test/CN=$cn" \
        -key "$keyfile" | \
        openssl x509 \
            -req -sha256 \
            -CA certs/redisCA.crt \
            -CAkey certs/redisCA.key \
            -CAserial certs/redisCA.txt \
            -CAcreateserial \
            -days 365 \
            $opts \
            -out "$certfile"
}

[ -f certs/redisCA.key ] || openssl genrsa -out certs/redisCA.key 4096
[ -f certs/redisCA.crt ] || openssl req \
    -x509 -new -nodes -sha256 \
    -key certs/redisCA.key \
    -days 3650 \
    -subj '/O=Redis Test/CN=Certificate Authority' \
    -out certs/redisCA.crt

SSL_CONF=certs/redis-openssl.cnf
cat > $SSL_CONF <<_END_
[ server_cert ]
keyUsage = digitalSignature, keyEncipherment
nsCertType = server
[ client_cert ]
keyUsage = digitalSignature, keyEncipherment
nsCertType = client
_END_

[ -f certs/redis-server.crt ] || generate_cert redis-server "Server-only" "-extfile $SSL_CONF -extensions server_cert"
[ -f certs/redis-client.crt ] || generate_cert redis-client "Client-only" "-extfile $SSL_CONF -extensions client_cert"
[ -f certs/redis.crt ] || generate_cert redis "Generic-cert"

# we do not use redis.dh currently
# [ -f certs/redis.dh ] || openssl dhparam -out certs/redis.dh 2048

rm -f $SSL_CONF
rm -f certs/redisCA.txt
