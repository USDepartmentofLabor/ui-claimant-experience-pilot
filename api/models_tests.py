# -*- coding: utf-8 -*-
from django.test import TransactionTestCase
from django.db import IntegrityError
from jwcrypto import jwk
from jwcrypto.common import json_decode
from api.models import SWA, IdentityProvider


class ApiModelsTestCase(TransactionTestCase):
    def test_swa(self):
        # generate a public/private key pair for the test
        private_key_jwk = jwk.JWK.generate(kty="RSA", size=1024)
        # leaving here as an example in case we need it in future
        # private_key = private_key_jwk.export_to_pem(True, None).decode("utf-8")
        public_key_jwk = jwk.JWK()
        public_key_jwk.import_key(**json_decode(private_key_jwk.export_public()))
        public_key = public_key_jwk.export_to_pem()

        # ad astra per aspera (the KS state motto)
        ks_swa = SWA(
            code="KS",
            name="Kansas",
            public_key=public_key.decode("utf-8"),
            public_key_fingerprint=public_key_jwk.thumbprint(),
        )
        ks_swa.save()

        # cannot create another KS row
        with self.assertRaises(IntegrityError) as context:
            SWA(code="KS", name="Duplicate KS").save()
        self.assertIn("Duplicate entry", str(context.exception))

        # public key round-trip works
        self.assertEqual(
            ks_swa.public_key_as_jwk().thumbprint(), ks_swa.public_key_fingerprint
        )

        # FK constraint works
        foobar_idp = IdentityProvider(name="foobar")
        foobar_idp.save()
        ks_swa.idp = foobar_idp
        ks_swa.save()
        self.assertEqual(foobar_idp.id, ks_swa.idp_id)

        foobar_idp.delete()
        ks_swa.refresh_from_db()
        self.assertEqual(ks_swa.idp, None)

        # status enum works
        self.assertEqual(ks_swa.get_status_display(), "Inactive")
        self.assertEqual(ks_swa.status, SWA.StatusOptions.INACTIVE)
        # NOTE there is no constraint with enum -- possible to set a value not in our options list
        ks_swa.status = 2
        ks_swa.save()
        self.assertEqual(ks_swa.get_status_display(), 2)
