# -*- coding: utf-8 -*-
from jwcrypto import jwk, jwe
from jwcrypto.common import json_encode, json_decode, base64url_decode
from django.conf import settings


ALG = "ECDH-ES+A256KW"
ENC = "A256GCM"


def symmetric_encryption_key(key_string=None):
    return jwk.JWK(kty="oct", k=(key_string or settings.CLAIM_SECRET_KEY[0]))


# the hexdigest() of the JWK thumbprint()
def encryption_key_hash(encryption_key):
    return base64url_decode(encryption_key.thumbprint()).hex()


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
        if self.packaged_claim["public_kid"] != jwkey.thumbprint():
            raise ValueError("Key thumbprints do not match")
        self.key = jwkey

    def decrypt(self):
        jwetoken = jwe.JWE()
        jwetoken.deserialize(json_encode(self.packaged_claim["claim"]))
        jwetoken.decrypt(self.key)
        self.packaged_claim["decrypted_claim"] = json_decode(
            jwetoken.payload.decode("utf-8")
        )
        return self.packaged_claim["decrypted_claim"]


class RotatableSymmetricClaimDecryptor(object):
    """
    Requires:
    * "packaged_claim" string
    * list of base64-encoded strings to try and decrypt with
    """

    def __init__(self, packaged_claim_str, list_of_keys=None):
        self.packaged_claim_str = packaged_claim_str
        self.list_of_keys = list_of_keys if list_of_keys else settings.CLAIM_SECRET_KEY

    def decrypt(self):
        # find the correct key to decrypt with.
        packaged_claim = json_decode(self.packaged_claim_str)
        package_thumbprint = packaged_claim["public_kid"]
        for k in self.list_of_keys:
            jwkey = symmetric_encryption_key(k)
            if jwkey.thumbprint() == package_thumbprint:
                sd = SymmetricClaimDecryptor(self.packaged_claim_str, jwkey)
                return sd.decrypt()
        raise ValueError(
            "No key found matching packaged_claim public_kid: {}".format(
                package_thumbprint
            )
        )


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


class SymmetricKeyRotator(object):
    """
    Requires:
    * old key
    * new key
    """

    def __init__(self, old_key, new_key):
        self.old_key = old_key
        self.new_key = new_key

    # takes a PackagedClaim, returns a PackagedClaim
    def rotate(self, packaged_claim):
        old_key_decryptor = SymmetricClaimDecryptor(
            (
                packaged_claim.as_json()
                if isinstance(packaged_claim, PackagedClaim)
                else packaged_claim
            ),
            self.old_key,
        )
        decrypted_claim = old_key_decryptor.decrypt()
        new_key_encryptor = SymmetricClaimEncryptor(decrypted_claim, self.new_key)
        return new_key_encryptor.packaged_claim()

    # update all the related artifacts for a Claimant
    def rotate_artifacts_for_claimant(self, claimant):
        from .claim_storage import ClaimWriter, ClaimReader

        count = 0
        for claimant_file in claimant.claimantfile_set.all():
            old_encrypted_package = claimant_file.get_encrypted_package()
            new_encrypted_package = self.rotate(old_encrypted_package)
            cw = ClaimWriter(
                claim=claimant_file, payload=new_encrypted_package.as_json()
            )
            if not cw.write():
                raise Exception(
                    "Failed to write re-encrypted claimant file {}".format(
                        str(claimant_file.uuid)
                    )
                )
            count += 1
        for claim in claimant.claim_set.all():
            if claim.is_completed() or claim.is_deleted():
                continue
            cr = ClaimReader(claim, path=claim.partial_payload_path())
            if not cr.exists():
                continue
            old_encrypted_package = cr.read()
            new_encrypted_package = self.rotate(old_encrypted_package)
            cw = ClaimWriter(
                claim,
                payload=new_encrypted_package.as_json(),
                path=claim.partial_payload_path(),
            )
            if not cw.write():
                raise Exception(
                    "Failed to write re-encrypted partial claim {}".format(
                        str(claim.uuid)
                    )
                )
            count += 1
        return count
