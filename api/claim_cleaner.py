# -*- coding: utf-8 -*-

# fix up a Claim payload (as from the /completed-claim/ endpoint)
# for packaging. E.g. removes all the LOCAL_ properties.

import json
import re


class ClaimCleaner(object):
    def __init__(self, claim_request):
        self.claim_request = claim_request

    def cleaned(self):
        # serialize/deserialize to make a copy
        claim = json.loads(json.dumps(self.claim_request.payload))

        # set values we receive from whoami
        # this is to guarantee that they come directly from the IdP
        claim["idp_identity"] = self.claim_request.whoami.as_identity()

        # because "idp_identity" is a sub-schema that is also used standalone,
        # sync some values just in case.
        claim["idp_identity"]["swa_code"] = claim["swa_code"]
        claim["idp_identity"]["id"] = claim["id"]
        claim["idp_identity"]["claimant_id"] = claim["claimant_id"]

        # Like SSN in WhoAmI, FEIN and Alien Registration number have optional - delimiter,
        # but we always use them in packaged claims.
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
