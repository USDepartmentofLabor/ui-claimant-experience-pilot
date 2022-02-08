# -*- coding: utf-8 -*-
from jwcrypto.common import json_decode, base64url_decode
import os
from api.models import ClaimantFile
from core.claim_storage import ClaimWriter
from core.claim_encryption import (
    SymmetricClaimEncryptor,
    symmetric_encryption_key,
)
import logging

logger = logging.getLogger(__name__)

ACCEPTED_UPLOAD_TYPES = ["pdf", "png", "jpg"]


class Claimant1099GUploader(object):
    def __init__(self, request, claimant):
        self.swa = request.user
        self.payload = json_decode(request.body.decode("utf-8"))
        self.claimant = claimant
        self.invalid = None
        self.error = None
        self.validate()  # always call to prevent saving invalid files

    def save(self):
        if self.invalid:
            raise "Cannot save() an invalid 1099-G file upload"

        # create ClaimantFile record
        self.claimant_file = ClaimantFile(
            claimant=self.claimant,
            year=self.payload["year"],
            fileext=self.file_ext,
            filetype=ClaimantFile.FileTypeOptions.F1099G,
            swa=self.swa,
        )
        self.claimant_file.save()  # must save in order to create events later

        # save artifact
        # conveniently, a ClaimantFile has the same interface as a Claim so we treat it like one.
        self.payload["id"] = str(self.claimant_file.uuid)
        sym_encryptor = SymmetricClaimEncryptor(
            self.payload, symmetric_encryption_key()
        )
        packaged_file = sym_encryptor.packaged_claim()
        packaged_payload = packaged_file.as_json()
        try:
            cw = ClaimWriter(claim=self.claimant_file, payload=packaged_payload)
            if not cw.write():
                raise Exception("Failed to write claimant file")
            logger.debug("🚀 wrote claimant file")
            return True
        except Exception as error:
            logger.exception(error)
            return False

    def form_uuid(self):
        if not self.claimant_file:
            return False
        return str(self.claimant_file.uuid)

    def validate(self):
        if "file" not in self.payload:
            self.invalid = "missing file"
            return False
        if "filename" not in self.payload:
            self.invalid = "missing filename"
            return False
        filename_parsed = os.path.splitext(self.payload["filename"])
        if len(filename_parsed) < 2 or len(filename_parsed[1]) == 0:
            self.invalid = "missing filename extension"
            return False
        self.file_ext = filename_parsed[1].lower().replace(".", "")
        if self.file_ext not in ACCEPTED_UPLOAD_TYPES:
            self.invalid = "{} is not an accepted file type. Try one of {}".format(
                self.file_ext, ", ".join(ACCEPTED_UPLOAD_TYPES)
            )
            return False
        if "year" not in self.payload:
            self.invalid = "missing year"
            return False
        if len(self.payload["year"]) != 4:
            self.invalid = "4-digit year required"
            return False
        # TODO should we only allow one per year? what about corrected versions?
        try:
            self.decoded_file = base64url_decode(self.payload["file"])
        except ValueError:
            self.invalid = "file is not properly Base64-encoded"
            return False
        if not self.decoded_file:
            self.invalid = "file is empty or improperly encoded"
            return False
        return True
