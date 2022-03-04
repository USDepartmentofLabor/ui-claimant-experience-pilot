# -*- coding: utf-8 -*-

# fix up a Claim payload (as from the /completed-claim/ endpoint)
# for packaging. E.g. removes all the LOCAL_ properties.

import copy
import re


class ClaimCleaner(object):
    def __init__(self, payload, whoami):
        self.whoami = whoami
        self.payload = payload

    def cleaned(self):
        claim = copy.deepcopy(self.payload)

        # set values we receive from whoami
        # this is to guarantee that they come directly from the IdP
        claim["idp_identity"] = self.whoami.as_identity()

        # because "idp_identity" is a sub-schema that is also used standalone,
        # sync some values just in case.
        # use .get because this might be a partial claim being cleaned,
        # and the values in claim[] might not yet be set.
        claim["idp_identity"]["swa_code"] = claim.get("swa_code")
        claim["idp_identity"]["id"] = claim.get("id")
        claim["idp_identity"]["claimant_id"] = claim.get("claimant_id")

        # backwards compatability
        # use pop() in case the key does not exist
        claim.pop("identity_provider", None)

        # Like SSN from idp in WhoAmI, editable SSN from claim FEIN and Alien Registration number have optional - delimiter,
        # but we always use them in packaged claims.
        if "ssn" in claim:
            claim["ssn"] = re.sub(
                r"^([0-9]{3})-?([0-9]{2})-?([0-9]{4})$",
                r"\1-\2-\3",
                claim["ssn"],
            )
        if (
            "work_authorization" in claim
            and "alien_registration_number" in claim["work_authorization"]
        ):
            claim["work_authorization"]["alien_registration_number"] = re.sub(
                r"^([0-9]{3})-?([0-9]{3})-?([0-9]{3})$",
                r"\1-\2-\3",
                claim["work_authorization"]["alien_registration_number"],
            )
        if "employers" in claim:
            for employer in claim["employers"]:
                if "fein" in employer and employer["fein"]:
                    employer["fein"] = re.sub(
                        r"^([0-9]{2})-?([0-9]{7})$", r"\1-\2", employer["fein"]
                    )

        # remove any key that startswith LOCAL_
        # and recurse into any object or array similarly.
        def clean(claim):
            cleaned_claim = {}
            for key, value in claim.items():
                if key.startswith("LOCAL_"):
                    continue
                if isinstance(value, dict):
                    cleaned_claim[key] = clean(value)
                elif isinstance(value, list):
                    cleaned_list = []
                    for item in value:
                        if isinstance(item, dict):
                            cleaned_list.append(clean(item))
                        else:
                            cleaned_list.append(item)
                    cleaned_claim[key] = cleaned_list
                else:
                    cleaned_claim[key] = value
            return cleaned_claim

        return clean(claim)
