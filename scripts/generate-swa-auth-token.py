#!/usr/bin/env python
# -*- coding: utf-8 -*-

# example
# AUTH=`python scripts/generate-swa-auth-token.py private.pem secret KS` && curl -X GET -H "Authorization: JWT $AUTH" http://localhost:8004/swa/

import sys
import time
import secrets
from jwcrypto import jwk, jwt
from jwcrypto.jwk import InvalidJWKType

usage = "{} private-key.pem sekrit swa_code".format(sys.argv[0])

# parse args
if len(sys.argv) < 4:
    print(usage)
    exit(1)

swa_code = sys.argv[3]
private_key_file = sys.argv[1]
password = sys.argv[2].encode("utf-8")

# same for private PEM
private_pem = ""
with open(private_key_file, "rb") as pf:
    private_pem = pf.read()

# create JWK
private_key = jwk.JWK.from_pem(private_pem, password)

try:
    private_key.get_curve("P-256")
    alg = "ES256"
except InvalidJWKType:
    alg = "RS256"

print("Using algorithm {}".format(alg), file=sys.stderr)

headers = {
    "alg": alg,
    "kid": private_key.thumbprint(),
}
claims = {
    "iss": swa_code,
    "iat": time.time(),
    "nonce": secrets.token_hex(8),
}
token = jwt.JWT(header=headers, claims=claims, algs=["RS256", "ES256"])
token.make_signed_token(private_key)
print(token.serialize())
