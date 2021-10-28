# -*- coding: utf-8 -*-
from jwcrypto import jwk
from jwcrypto.common import json_decode


def generate_keypair():
    private_key_jwk = jwk.JWK.generate(kty="EC", crv="P-256")
    # leaving here as an example in case we need it in future
    # private_key = private_key_jwk.export_to_pem(True, None).decode("utf-8")
    public_key_jwk = jwk.JWK()
    public_key_jwk.import_key(**json_decode(private_key_jwk.export_public()))
    # leaving here as example
    # public_key = public_key_jwk.export_to_pem().decode("utf-8")
    return private_key_jwk, public_key_jwk
