# -*- coding: utf-8 -*-
from jwcrypto import jwk
from jwcrypto.common import json_decode
from .claim_writer import ClaimWriter


def generate_keypair():
    private_key_jwk = jwk.JWK.generate(kty="EC", crv="P-256")
    # leaving here as an example in case we need it in future
    # private_key = private_key_jwk.export_to_pem(True, None).decode("utf-8")
    public_key_jwk = jwk.JWK()
    public_key_jwk.import_key(**json_decode(private_key_jwk.export_public()))
    # leaving here as example
    # public_key = public_key_jwk.export_to_pem().decode("utf-8")
    return private_key_jwk, public_key_jwk


def create_s3_bucket():
    cw = ClaimWriter(True, True)
    cw.s3_client().create_bucket(Bucket=cw.bucket_name())


def delete_s3_bucket():
    cw = ClaimWriter(True, True)
    # must delete all objects first, then delete bucket
    bucket = cw.bucket()
    bucket.objects.all().delete()
    cw.s3_client().delete_bucket(Bucket=cw.bucket_name())
