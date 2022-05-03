# SWA API

This State Workforce Agency (SWA) Application Programming Interface (API) documentation describes the HTTP
API SWAs use to manage Claims submitted through the US DOL Claimant Pilot.

All HTTP requests require authentication. For brevity, the proper `Authorization: JWT` HTTP header is omitted
from all examples except in the _Authentication_ section.

Examples are given using the `curl` command for simplicity. The production URL is used in all examples.

## Versioning

The API version is noted in the URL patterns. The current version is `v1`.

## Authentication

All API authentication and Claim decryption relies on a public/private keypair that each SWA generates. The
public key must be communicated to US DOL through verified email. The private key must be kept secret and safe
within the SWA IT infrastructure.

### Keypair generation

Example keypair generation for a SWA named `KS`:

```sh
#!/bin/bash

set -e

PREFIX=KS

echo "Private key password: "
read -r -s PASSWD
echo

PRIVATE_KEY="${PREFIX}-private.pem"
PUBLIC_KEY="${PREFIX}-public.pem"

openssl ecparam -genkey -name P-256 | openssl ec -aes256 -out "${PRIVATE_KEY}" -passout pass:"$PASSWD"
openssl ec -in "${PRIVATE_KEY}" -passin pass:"$PASSWD" -pubout -out "${PUBLIC_KEY}"
```

The resulting public key `KS-public.pem` can be emailed to US DOL. The `KS-private.pem` should be stored
like a password.

### API authorization

Every API HTTP request must have an `Authorization: JWT` header with a JSON Web Token (JWT) signed
with the SWA's private key.

Example JWT token generation:

```python
#!/usr/bin/env python

# example
# TOKEN=`python scripts/generate-swa-auth-token.py KS-private.pem secret KS` && \
#     curl -X GET -H "Authorization: JWT $TOKEN" https://unemployment.dol.gov/swa/

import sys
import time
import secrets
from jwcrypto import jwk, jwt

usage = "{} private-key.pem sekrit swa_code".format(sys.argv[0])

# parse args
if len(sys.argv) < 4:
    print(usage)
    exit(1)

swa_code = sys.argv[3]
private_key_file = sys.argv[1]
password = sys.argv[2].encode("utf-8")

with open(private_key_file, "rb") as pf:
    private_pem = pf.read()

private_key = jwk.JWK.from_pem(private_pem, password)

alg = "ES256"

headers = {
    "alg": alg,
    "kid": private_key.thumbprint(),
}
claims = {
    "iss": swa_code,
    "iat": time.time(),
    "nonce": secrets.token_hex(8),
}
token = jwt.JWT(header=headers, claims=claims, algs=[alg])
token.make_signed_token(private_key)
print(token.serialize())
```

## Managing the Claim queue

To get a list of all unprocessed Claims, issue a `GET` request to the `/swa/claims/` endpoint:

```sh
% curl -X GET https://unemployment.dol.gov/swa/v1/claims/
{
  "total_claims": 50,
  "next": "https://unemployment.dol.gov/swa/v1/claims/?page=2",
  "claims": [
    {
      "public_kid": "BS0Qv8Lz4Uk.SaVE2YkNFSbXu6KxBhx3",
      "claim_id": "1f5eb062-fa36-479c-8c22-7e9fafcf0cfd",
      "claim": {
        "ciphertext": base64-encoded string,
        "encrypted_key": base64-encoded string,
        "iv": string,
        "protected": string,
        "tag": string
      }
    },
    // 9 more claims
  ]
}
```

The `claim` value is a JSON Web Encryption (JWE) structure that must be decrypted with the SWA's private key.
Here's an example using Python:

```python
from jwcrypto import jwk, jwe
from jwcrypto.common import json_decode

# private_pem and password are secrets you manage
private_key = jwk.JWK.from_pem(private_pem, password)
jwetoken = jwe.JWE()
jwetoken.deserialize(claim_json_string, key=private_key)

claim = json_decode(jwetoken.payload.decode("utf-8"))
# iterate over the keys of claim and process in your system of record
```

To remove a Claim from the queue, indicating that the SWA now owns it:

```sh
% curl -X PATCH https://unemployment.dol.gov/swa/v1/claims/1f5eb062-fa36-479c-8c22-7e9fafcf0cfd \
       --data '{"fetched":true}'
{"status": "ok"}
```

## Claim details

To get the details about a specific claim, use its id (UUID):

```sh
% curl -X GET https://unemployment.dol.gov/swa/v1/claims/1f5eb062-fa36-479c-8c22-7e9fafcf0cfd
{
  "id": "1f5eb062-fa36-479c-8c22-7e9fafcf0cfd",
  "swa_xid": "your-unique-swa-xid-value",
  "created_at": "2021-11-05T16:54:15-0500",
  "updated_at": "2021-11-05T16:54:15-0500",
  "claimant_id": "1d0a0ccc77d551f806d0e99740c1d9607c5f1da1",
  "events": [ ], // history of the Claim
  "status": "established",
}
```

If you have previously associated a claim via a `swa_xid` value, you can alternately use the `swa_xid` value
in the URL path:

```sh
% curl -X GET https://unemployment.dol.gov/swa/v1/claims/your-unique-swa-xid-value
{
  "id": "1f5eb062-fa36-479c-8c22-7e9fafcf0cfd",
  "swa_xid": "your-unique-swa-xid-value",
  "created_at": "2021-11-05T16:54:15-0500",
  "updated_at": "2021-11-05T16:54:15-0500",
  "claimant_id": "1d0a0ccc77d551f806d0e99740c1d9607c5f1da1",
  "events": [ ], // history of the Claim
  "status": "established",
}
```

## Updating Claim status

When a Claim is processed within the SWA system of record, and the SWA wants to update the Claim's status
as a Claimant might see it:

```sh
% curl -X PATCH https://unemployment.dol.gov/swa/v1/claims/1f5eb062-fa36-479c-8c22-7e9fafcf0cfd \
       --data '{"status":"established"}'
{"status": "ok"}
```

## Marking a Claim as resolved

Once a Claim has run its course in the SWA system of record, it should be marked as resolved in the USDOL system so
that any subsequent attempt by a claimant to create a new Claim can proceed. Otherwise, the USDOL system only allows
one completed Claim to exist per claimant and will disallow starting a new Claim.

The `resolved` parameter takes an optional "reason" that will be stored as the description on the Claim `RESOLVED` event.

```sh
% curl -X PATCH https://unemployment.dol.gov/swa/v1/claims/1f5eb062-fa36-479c-8c22-7e9fafcf0cfd \
       --data '{"resolved":"the claim was closed"}'
{"status": "ok"}
```

## Deleting sensitive Claim data

After a Claim has been established in the SWA's system of record and there is no longer any need for sensitive Claimant
data to exist on the DOL site, it's a good idea to remove it from the US DOL servers. _NOTE_ that this does not delete
the record history of the Claim, only what the Claimant submitted (sensitive PII).

```sh
% curl -X DELETE https://unemployment.dol.gov/swa/v1/claims/1f5eb062-fa36-479c-8c22-7e9fafcf0cfd
{"status": "ok"}
```

## Uploading a Claimant 1099-G Form

To upload a completed 1099-G Form file via the API, you need the `claimant_id` value from the Claim. The `claimant_id` is
included in the original encrypted `claim` payload. See the [Claim details](#claim-details) section.

To upload the 1099-G:

```sh
% FORM=`base64 < path/to/1099G-file.pdf` \
  curl -X POST https://unemployment.dol.gov/swa/v1/claimants/1d0a0ccc77d551f806d0e99740c1d9607c5f1da1/1099G \
       --data "{\"file\":\"$FORM\", \"year\":\"2022\", \"type\":\"PDF\"}"
{
  "status": "ok",
  "1099G": "5e775a83-efd5-403c-85c6-0f3db4cfa3ac"
}
```
