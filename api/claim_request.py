# -*- coding: utf-8 -*-
# turn a HTTPRequest into a valid Claim
from django.http import JsonResponse
from .models import SWA, Claim, Claimant
from .whoami import WhoAmI
import json
from dacite import from_dict


MISSING_SWA_CODE = "missing swa_code"
MISSING_CLAIMANT_ID = "missing claimant_id"
INVALID_SWA_CODE = "invalid swa_code"
INVALID_CLAIM_ID = "invalid claim id"
INVALID_CLAIMANT_ID = "invalid claimant_id"


class ClaimRequest(object):
    def __init__(self, request):
        self.response = None
        self.error = None
        self.whoami = from_dict(data_class=WhoAmI, data=request.session.get("whoami"))
        self.payload = json.loads(request.body.decode("utf-8"))
        self.__build_request()
        self.is_complete = "is_complete" in self.payload and self.payload["is_complete"]

    def __build_request(self):
        # we minimally need the SWA, Claimant, and Claim.
        if "swa_code" in self.payload:
            swa_code = self.payload["swa_code"]
        else:
            self.error = MISSING_SWA_CODE
            self.response = JsonResponse({"error": MISSING_SWA_CODE}, status=400)
            return

        try:
            self.swa = SWA.objects.get(code=swa_code)
        except SWA.DoesNotExist:
            self.error = INVALID_SWA_CODE
            self.response = JsonResponse({"error": INVALID_SWA_CODE}, status=404)
            return

        if "claimant_id" in self.payload:
            claimant_id = self.payload["claimant_id"]
        else:
            self.error = MISSING_CLAIMANT_ID
            self.response = JsonResponse({"error": MISSING_CLAIMANT_ID}, status=400)
            return

        try:
            self.claimant = Claimant.objects.get(idp_user_xid=claimant_id)
        except Claimant.DoesNotExist:
            self.error = INVALID_CLAIMANT_ID
            self.response = JsonResponse({"error": INVALID_CLAIMANT_ID}, status=404)
            return

        claim_id = None
        if "id" in self.payload:
            claim_id = self.payload["id"]
        # get or create Claim, as we might not have started one yet.
        try:
            if claim_id:
                self.claim = Claim.objects.get(uuid=claim_id)
                if self.claim.claimant != self.claimant:
                    self.error = INVALID_CLAIM_ID
                    self.response = JsonResponse(
                        {"error": INVALID_CLAIM_ID}, status=401
                    )
                    return
            else:
                self.claim = Claim(claimant=self.claimant, swa=self.swa)
                self.claim.save()
                self.payload["id"] = str(self.claim.uuid)
        except Claim.DoesNotExist:
            self.error = INVALID_CLAIM_ID
            self.response = JsonResponse({"error": INVALID_CLAIM_ID}, status=404)
            return
