# -*- coding: utf-8 -*-
from django.test import TestCase, RequestFactory
from jwcrypto.common import base64url_encode
import logging
from api.test_utils import create_swa, create_idp, create_claimant
from swa.claimant_1099G_uploader import Claimant1099GUploader, InvalidUploadError
from unittest.mock import patch
import boto3
from botocore.stub import Stubber

logger = logging.getLogger(__name__)


class Claimant1099GUploaderTestCase(TestCase):
    def setUp(self):
        super().setUp()
        idp = create_idp()
        self.claimant = create_claimant(idp)
        self.swa, _ = create_swa(True)

    def create_uploader(self, body):
        request = RequestFactory().post(
            f"/swa/v1/claimants/{self.claimant.idp_user_xid}/1099G/",
            content_type="application/json",
            data=body,
        )
        request.session = self.client.session
        request.user = self.swa
        uploader = Claimant1099GUploader(request, self.claimant)
        return uploader

    def test_uploader_params(self):
        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertTrue(uploader.validate())
        self.assertFalse(uploader.invalid)

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing year")

        body = {"filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing file")

        body = {"file": "=", "filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "file is not properly Base64-encoded")

        body = {"file": "", "filename": "path/to/file.pdf", "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "file is empty or improperly encoded")

        body = {"file": base64url_encode("pretend-file"), "year": "2022"}
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing filename")

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "missing filename extension")

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.FOO",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(
            uploader.invalid,
            "foo is not an accepted file type. Try one of pdf, png, jpg",
        )

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "22",
        }
        uploader = self.create_uploader(body)
        self.assertFalse(uploader.validate())
        self.assertEquals(uploader.invalid, "4-digit year required")

    @patch("core.claim_storage.ClaimStore.s3_client")
    def test_exceptions(self, mock_boto3_client):
        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "22",
        }
        uploader = self.create_uploader(body)
        with self.assertRaises(InvalidUploadError) as context:
            uploader.save()
        self.assertIn(
            "Cannot save() an invalid 1099-G file upload", str(context.exception)
        )
        self.assertFalse(uploader.form_uuid())

        body = {
            "file": base64url_encode("pretend-file"),
            "filename": "path/to/file.pdf",
            "year": "2022",
        }
        uploader = self.create_uploader(body)
        self.assertTrue(uploader.validate())

        client = boto3.client("s3")
        stubber = Stubber(client)
        stubber.add_client_error("put_object")
        stubber.activate()
        mock_boto3_client.return_value = client
        self.assertFalse(uploader.save())
