# -*- coding: utf-8 -*-
from .models import IdentityProvider, SWA, Claimant
from core.test_utils import generate_keypair


def create_idp():
    idp = IdentityProvider(name="my identity provider")
    idp.save()
    return idp


def create_swa():
    private_key_jwk, public_key_jwk = generate_keypair()

    # ad astra per aspera (the KS state motto)
    swa = SWA(
        code="KS",
        name="Kansas",
        public_key=public_key_jwk.export_to_pem().decode("utf-8"),
        public_key_fingerprint=public_key_jwk.thumbprint(),
    )
    swa.save()
    return swa, private_key_jwk


def create_claimant(idp):
    claimant = Claimant(
        idp_user_xid="my idp id",
        idp=idp,
    )
    claimant.save()
    return claimant
