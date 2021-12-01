# -*- coding: utf-8 -*-
from jwcrypto import jwk, jwe
from jwcrypto.common import json_encode, json_decode
from django.conf import settings


ALG = "ECDH-ES+A256KW"
ENC = "A256GCM"


def symmetric_encryption_key():
    return jwk.JWK(kty="oct", k=settings.CLAIM_SECRET_KEY)


class AsymmetricClaimEncryptor(object):
    """
    Requires "claim" (dict) and "public_key" (PEM string or JWK).
    """

    def __init__(self, claim, public_key):
        if isinstance(public_key, bytes):
            self.public_key = jwk.JWK.from_pem(public_key)
        elif isinstance(public_key, str):
            self.public_key = jwk.JWK.from_pem(public_key.encode("utf-8"))
        else:
            self.public_key = public_key
        self.claim = claim
        self.public_key_thumbprint = self.public_key.thumbprint()

    def protected_header(self):
        return {
            "alg": ALG,
            "enc": ENC,
            "typ": "JWE",
            "kid": self.public_key_thumbprint,
        }

    def __encrypt(self):
        return jwe.JWE(
            json_encode(self.claim),
            recipient=self.public_key,
            protected=self.protected_header(),
        )

    def packaged_claim(self):
        jwetoken = self.__encrypt()
        return PackagedClaim(jwetoken, self.public_key_thumbprint, self.claim["id"])


class AsymmetricClaimDecryptor(object):
    """
    Requires:
    * "packaged_claim" string
    * "private_key" (PEM string or JWK)
    * "password" string (optional if "private_key" is already a JWK)
    """

    def __init__(self, packaged_claim_str, private_key, password=None):
        if isinstance(private_key, bytes):
            self.private_key = jwk.JWK.from_pem(private_key, password)
        elif isinstance(private_key, str):
            self.private_key = jwk.JWK.from_pem(private_key.encode("utf-8"), password)
        else:
            self.private_key = private_key
        self.packaged_claim = json_decode(packaged_claim_str)

    def decrypt(self):
        jwetoken = jwe.JWE()
        jwetoken.deserialize(
            json_encode(self.packaged_claim["claim"]), key=self.private_key
        )
        self.packaged_claim["decrypted_claim"] = json_decode(
            jwetoken.payload.decode("utf-8")
        )
        return self.packaged_claim["decrypted_claim"]


class SymmetricClaimEncryptor(object):
    """
    Requires "claim" (dict) and "jwkey" JWK (e.g. jwk.JWK(generate='oct', size=256))
    """

    def __init__(self, claim, jwkey):
        self.claim = claim
        self.key = jwkey

    def __encrypt(self):
        jwetoken = jwe.JWE(
            json_encode(self.claim), json_encode({"alg": "A256GCMKW", "enc": ENC})
        )
        jwetoken.add_recipient(self.key)
        return jwetoken

    def packaged_claim(self):
        jwetoken = self.__encrypt()
        return PackagedClaim(jwetoken, self.key.thumbprint(), self.claim["id"])


class SymmetricClaimDecryptor(object):
    """
    Requires:
    * "packaged_claim" string
    * "jwkey" JWK
    """

    def __init__(self, packaged_claim_str, jwkey):
        self.packaged_claim = json_decode(packaged_claim_str)
        self.key = jwkey

    def decrypt(self):
        jwetoken = jwe.JWE()
        jwetoken.deserialize(json_encode(self.packaged_claim["claim"]))
        jwetoken.decrypt(self.key)
        self.packaged_claim["decrypted_claim"] = json_decode(
            jwetoken.payload.decode("utf-8")
        )
        return self.packaged_claim["decrypted_claim"]


class PackagedClaim(object):
    """
    Requires:
    * "jwetoken" as produced by jwt.JWE()
    * "public_key_thumbprint" as produced by ClaimEncryptor()
    * "claim_id" string from the claim encrypted within the jwetoken
    """

    def __init__(self, jwetoken, public_key_thumbprint, claim_id):
        self.jwetoken = json_decode(jwetoken.serialize())
        self.thumbprint = public_key_thumbprint
        self.claim_id = claim_id

    def as_dict(self):
        return {
            "public_kid": self.thumbprint,
            "claim_id": self.claim_id,
            "claim": self.jwetoken,
        }

    def as_json(self):
        return json_encode(self.as_dict())
