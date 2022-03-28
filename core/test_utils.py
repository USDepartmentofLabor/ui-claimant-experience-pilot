# -*- coding: utf-8 -*-
from jwcrypto import jwk, jwt
from jwcrypto.common import json_decode
from .claim_storage import BUCKET_TYPE_ARCHIVE, ClaimBucket, ClaimStore
import secrets
import time
import base64
from django.test import TestCase


def generate_keypair():
    private_key_jwk = jwk.JWK.generate(kty="EC", crv="P-256")
    # leaving here as an example in case we need it in future
    # private_key = private_key_jwk.export_to_pem(True, None).decode("utf-8")
    public_key_jwk = jwk.JWK()
    public_key_jwk.import_key(**json_decode(private_key_jwk.export_public()))
    # leaving here as example
    # public_key = public_key_jwk.export_to_pem().decode("utf-8")
    return private_key_jwk, public_key_jwk


def create_s3_bucket(is_archive=False):
    claim_bucket = ClaimBucket(bucket_type=BUCKET_TYPE_ARCHIVE) if is_archive else None
    cs = ClaimStore(claim_bucket=claim_bucket)
    cs.bucket().create()


def delete_s3_bucket(is_archive=False):
    claim_bucket = ClaimBucket(bucket_type=BUCKET_TYPE_ARCHIVE) if is_archive else None
    cs = ClaimStore(claim_bucket=claim_bucket)
    # must delete all objects first, then delete bucket
    bucket = cs.bucket()
    bucket.objects.all().delete()
    bucket.delete()


def generate_auth_token(private_key, swa_code):
    headers = {
        "alg": "ES256",
        "kid": private_key.thumbprint(),
    }
    claims = {
        "iss": swa_code,
        "iat": time.time(),
        "nonce": secrets.token_hex(8),
    }
    token = jwt.JWT(header=headers, claims=claims, algs=["ES256"])
    token.make_signed_token(private_key)
    return token.serialize()


def generate_symmetric_encryption_key():
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("utf-8")


class BucketableTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()
        create_s3_bucket(is_archive=True)

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()
        delete_s3_bucket(is_archive=True)
