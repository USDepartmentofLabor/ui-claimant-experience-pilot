# -*- coding: utf-8 -*-
from api.models import SWA

# NOTE this is *not* the jwcrypto.jwt library, but pyjwt
# we use pyjwt because it has an API to allow for verify_signature:false
import jwt
import logging
import time
from django.core.cache import cache


logger = logging.getLogger(__name__)

# this file adapted from
# https://github.com/crgwbr/asymmetric-jwt-auth/blob/master/src/asymmetric_jwt_auth/middleware.py


class JwtError(Exception):
    pass


# number of seconds leeway we give for issued-at timestamps, to allow for clock drift.
# This means a token must be used with +/- this many seconds of the server time.
TIMESTAMP_TOLERANCE = 30


class JwtAuthorizer(object):
    def __init__(self, request):
        self.authorized = self.__authorize(request)

    def __validate_token(self, unverified_jwt):
        try:
            unverified_claims = jwt.decode(
                jwt=unverified_jwt,
                algorithms=["RS256", "ES256"],
                options={
                    "verify_signature": False,
                    "require": ["iat", "iss", "nonce"],
                },
            )
        except jwt.exceptions.MissingRequiredClaimError as err:
            logger.error(err)
            return

        claimed_time = unverified_claims["iat"]
        current_time = time.time()
        min_time, max_time = (
            current_time - TIMESTAMP_TOLERANCE,
            current_time + TIMESTAMP_TOLERANCE,
        )
        if claimed_time < min_time or claimed_time > max_time:
            raise JwtError("Claimed time outside of tolerance")

        return unverified_claims

    def __verify_token(self, unverified_jwt, public_key):
        # ok to ignore the return value, since errors raise exception.
        try:
            jwt.decode(
                jwt=unverified_jwt,
                key=public_key,
                algorithms=["RS256", "ES256"],
            )
        except jwt.exceptions.InvalidAlgorithmError:
            raise JwtError("jwt.exceptions.InvalidAlgorithmError")
        except jwt.exceptions.InvalidSignatureError:
            raise JwtError("jwt.exceptions.InvalidSignatureError")
        # TODO other specific exceptions?

        return True

    def __authorize(self, request):
        # Check for presence of auth header
        if "HTTP_AUTHORIZATION" not in request.META:
            raise JwtError("Missing Authorization header")

        # Ensure this auth header was meant for us (it has the JWT auth method).
        try:
            method, unverified_jwt = request.META["HTTP_AUTHORIZATION"].split(" ", 1)
        except ValueError:
            raise JwtError("Invalid Authorization header")

        if method.upper() != "JWT":
            logger.debug("Skipping {} method".format(method))
            return

        # validate the token
        unverified_claims = self.__validate_token(unverified_jwt)
        if not unverified_claims:
            return

        # are they an active SWA?
        swa_code = unverified_claims["iss"]
        try:
            swa = SWA.active.get(code=swa_code)
        except SWA.DoesNotExist:
            raise JwtError("Invalid iss value: {}".format(swa_code))

        # do the key fingerprints match?
        unverified_header = jwt.get_unverified_header(unverified_jwt)
        if swa.public_key_fingerprint != unverified_header["kid"]:
            raise JwtError("Key fingerprints do not match for {}".format(swa_code))

        logger.debug("JWT for {} looks valid, verifying".format(swa_code))

        # verify the claims with signature
        if not self.__verify_token(unverified_jwt, swa.public_key):
            return

        # verify the nonce has not been seen before
        # NOTE the combination of the nonce and the issued-at time value in the verified claims
        # combined are what guarantee we are not seeing a re-play.
        nonce = unverified_claims["nonce"]
        issued_at_time = unverified_claims["iat"]
        cache_key = "{}-nonce-{}".format(swa_code, issued_at_time)
        used_nonces = cache.get(cache_key, set([]))
        if nonce in used_nonces:
            raise JwtError("nonce already used")

        used_nonces.add(nonce)
        # expiration is 2 x the leeway, for clock drift.
        cache.set(cache_key, used_nonces, TIMESTAMP_TOLERANCE * 2)

        # Assign the user to the request
        logger.debug("Successfully authenticated %s using JWT", swa_code)
        request.verified_swa_request = True
        self.swa = swa
        return True
