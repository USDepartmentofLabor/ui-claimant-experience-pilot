# -*- coding: utf-8 -*-

# fix up a Claim payload (as from the /completed-claim/ endpoint)
# for packaging. E.g. removes all the LOCAL_ properties.


class ClaimCleaner(object):
    def __init__(self, claim):
        self.claim = claim

    def cleaned(self):
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

        return clean(self.claim)
