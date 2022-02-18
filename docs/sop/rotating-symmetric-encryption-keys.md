# Rotating symmetric encryption keys

All SOPs that involve running a `make` command must be executed within a running container inside the relevant WCMS environment.
See the [Connecting to a WCMS container](./connecting-to-wcms-container.md) SOP.

The `CLAIM_SECRET_KEY` environment variable can hold an array of base64-encoded encryption keys. These are used to symmetrically
encrypt Claims and ClaimantFiles in our S3 bucket. The first key in the array is always used for encrypting. All the keys in the array
can be used for decrypting, tried one-at-a-time until the thumbprints match.

In order to remove an old key from the `CLAIM_SECRET_KEY` array, you must first rotate the keys so that older artifacts are re-encrypted
using a newer key. You can perform that rotation in this order.

## Deploy the container with `CLAIM_SECRET_KEY` including all the keys, in order of newest to oldest

Example from the `core/.env-example` file in this repo:

```sh
CLAIM_SECRET_KEY=["TDElUv1XAuRjsBZ7EkDwBZcMa7uJRaFiYZLmhqu_UG8=", "otWwpNNT38CmW_8NNEzL6m2jBBhl2iVhEcNdyu_RTis="]
```

## Run `make rotate-claim-secrets`

Connect to a running container, and execute:

```sh
> make rotate-claim-secrets OLD_KEY=:base64str: NEW_KEY=:base64str:
```

It will report at the end how many artifacts were rotated (re-encrypted).
You may choose to put the app into maintenance mode during the key rotation, to avoid the possible
race condition where a Claimant has artifacts encrypted with multiple different keys.

## Remove the `OLD_KEY` value from the `CLAIM_SECRET_KEY` env var and re-deploy.

NOTE that Redis symmetric encryption does not support key rotation. However, the time-to-live in Redis is short (30 minutes) so this
is deemed an acceptable risk. The effect of changing the `REDIS_SECRET_KEY` value is effectively removing all active authenticated
sessions from the app, so if you must do that, perform it during a non-peak traffic time and/or put the app into maintenance mode.
