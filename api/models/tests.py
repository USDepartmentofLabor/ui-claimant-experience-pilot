# -*- coding: utf-8 -*-
from django.test import TransactionTestCase, TestCase
from django.db import IntegrityError
from django.db.models import ProtectedError
from django.conf import settings
from api.models import SWA, IdentityProvider, Claimant, Claim
from api.models.claim import (
    SUCCESS,
    FAILURE,
    CLAIMANT_STATUS_IN_PROCESS,
    CLAIMANT_STATUS_PROCESSING,
    CLAIMANT_STATUS_CANCELLED,
    CLAIMANT_STATUS_ACTIVE,
    CLAIMANT_STATUS_RESOLVED,
    CLAIMANT_STATUS_DELETED,
)
import datetime
from datetime import timedelta
from dateutil.tz import gettz
from django.utils import timezone
from api.test_utils import create_swa, create_idp, create_claimant
import logging
from jwcrypto.common import json_decode
import boto3
from botocore.stub import Stubber
from core.claim_storage import ClaimWriter
from unittest.mock import patch
from core.test_utils import (
    create_s3_bucket,
    delete_s3_bucket,
)
from api.test_utils import build_claim_updated_by_event

logger = logging.getLogger(__name__)


class ApiModelsManagerTestCase(TestCase):
    def test_swa_manager(self):
        ks_swa, _ = create_swa()
        swas = SWA.active.all()
        for swa in swas:
            logger.debug("SWA: {} {}".format(swa.code, swa.get_status_display()))
        # 2 default + filters out ks_swa because not active
        self.assertEqual(len(swas), 2)

        ks_swa.status = SWA.StatusOptions.ACTIVE
        ks_swa.save()
        another_swa = SWA(code="AA", name="Alpha", status=SWA.StatusOptions.ACTIVE)
        another_swa.save()
        swas = SWA.active.order_by("name").all()
        self.assertEqual(
            list(map(lambda swa: swa.code, swas)), ["AA", "AR", "KS", "NJ"]
        )

    def test_expired_claim_manager(self):
        claim_lifespan = settings.DELETE_PARTIAL_CLAIM_AFTER_DAYS
        swa, _ = create_swa()
        idp = create_idp()
        expired_claim_uuid = "0a5cf608-0c72-4d37-8695-85497ad53d34"
        test_data_cases = [
            {
                "idp_user_xid": 1,
                "uuid": expired_claim_uuid,
                "days_ago_created": claim_lifespan + 1,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 1,
                    }
                ],
            },
            {
                "idp_user_xid": 2,
                "uuid": "b2edb136-d166-4e28-8e83-b0ea48eef7e0",
                "days_ago_created": claim_lifespan + 3,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 3,
                    },
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 2,
                    },
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 4,
                    },
                ],
            },
            {
                "idp_user_xid": 3,
                "uuid": "5060ee6f-8ae0-4056-ad5e-5d10fa0b5d59",
                "days_ago_created": claim_lifespan + 3,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 3,
                    },
                    {
                        "category": Claim.EventCategories.COMPLETED,
                        "days_ago_happened": claim_lifespan + 2,
                    },
                ],
            },
            {
                "idp_user_xid": 4,
                "uuid": "4912139b-71bc-4c69-ac6e-5564f2f1091c",
                "days_ago_created": claim_lifespan + 3,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan + 3,
                    },
                    {
                        "category": Claim.EventCategories.DELETED,
                        "days_ago_happened": claim_lifespan + 2,
                    },
                ],
            },
            {
                "idp_user_xid": 5,
                "uuid": "9656b523-151e-482d-9c4b-2aec21764547",
                "days_ago_created": claim_lifespan - 3,
                "events": [
                    {
                        "category": Claim.EventCategories.STORED,
                        "days_ago_happened": claim_lifespan - 3,
                    }
                ],
            },
        ]

        for case in test_data_cases:
            build_claim_updated_by_event(
                idp=idp,
                swa=swa,
                idp_user_xid=case["idp_user_xid"],
                uuid=case["uuid"],
                events=case["events"],
            )

        claims = Claim.expired_partial_claims.all()
        claim_ids = list(map(lambda c: str(c.uuid), claims))
        self.assertEqual(claim_ids, [expired_claim_uuid])
        self.assertEqual(claims.count(), 1)
        self.assertEqual(str(claims[0].uuid), expired_claim_uuid)


class ApiModelsTestCase(TransactionTestCase):
    def test_swa(self):
        keyless_swa = SWA(code="NO", name="NO", claimant_url="no")
        keyless_swa.save()
        with self.assertRaises(ValueError) as context:
            keyless_swa.public_key_as_jwk()

        ks_swa, private_key_jwk = create_swa()

        self.assertTrue(ks_swa.created_at)
        self.assertTrue(ks_swa.updated_at)
        self.assertIsInstance(ks_swa.created_at, datetime.datetime)
        self.assertIsInstance(ks_swa.updated_at, datetime.datetime)

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

    def test_swa_claim_queue(self):
        swa, _ = create_swa()
        idp = create_idp()
        claimant = create_claimant(idp)
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        claim2 = Claim(swa=swa, claimant=claimant)
        claim2.save()

        self.assertEqual(swa.claim_queue().count(), 0)

        claim.events.create(category=Claim.EventCategories.COMPLETED)
        self.assertEqual(swa.claim_queue().count(), 1)

        claim2.events.create(category=Claim.EventCategories.COMPLETED)
        self.assertEqual(swa.claim_queue().count(), 2)

        claim.events.create(category=Claim.EventCategories.FETCHED)
        self.assertEqual(swa.claim_queue().count(), 1)

        claim2.events.create(category=Claim.EventCategories.DELETED)
        self.assertEqual(swa.claim_queue().count(), 0)

    def test_claimant(self):
        idp = create_idp()

        claimant = create_claimant(idp)

        # claimant will not be deleted if the idp is deleted
        with self.assertRaises(ProtectedError):
            idp.delete()

        claimant_copy = Claimant.objects.get(id=claimant.id)
        self.assertEqual(claimant_copy.idp, idp)

    def test_claimant_IAL(self):
        idp = create_idp()
        claimant = create_claimant(idp)

        self.assertFalse(claimant.bump_IAL_if_necessary("3"))
        self.assertFalse(claimant.bump_IAL_if_necessary("1"))
        self.assertTrue(
            claimant.bump_IAL_if_necessary("2")
        )  # only the first results in a change
        self.assertFalse(claimant.bump_IAL_if_necessary("2"))

    def test_claim_initiate_with_swa_xid(self):
        # we use AR because we know we have a swa_xid format defined
        try:
            swa = SWA.active.get(code="AR")
        except SWA.DoesNotExist:
            swa, _ = create_swa(
                code="AR",
                is_active=True,
                featureset=SWA.FeatureSetOptions.IDENTITY_ONLY,
            )
        idp = create_idp()
        claimant = create_claimant(idp)

        # simple case: no swa_xid returns false
        claim = Claim(swa=swa, claimant=claimant)
        claim.save()
        self.assertFalse(claim.is_swa_xid_expired())
        self.assertFalse(claimant.pending_identity_only_claim())

        # use an "old" date we know will show as expired
        swa_xid = "20000101-123456-1234567-123456789"
        utc_swa_dt = "2000-01-01T18:34:56+00:00"
        claim = Claim.initiate_with_swa_xid(swa, claimant, swa_xid)
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.INITIATED_WITH_SWA_XID
            ).count(),
            1,
        )
        event = claim.events.filter(
            category=Claim.EventCategories.INITIATED_WITH_SWA_XID
        ).first()
        self.assertEqual(event.description, utc_swa_dt)
        self.assertEqual(event.happened_at, datetime.datetime.fromisoformat(utc_swa_dt))
        self.assertTrue(claim.is_swa_xid_expired())

        # now one not expired
        now = datetime.datetime.now(tz=gettz("US/Central")).replace(microsecond=0)
        now_utc = now.astimezone(gettz("UTC"))
        swa_xid = f"{now.strftime('%Y%m%d-%H%M%S')}-1234567-123456789"
        utc_swa_dt = now_utc.isoformat()
        claimant = create_claimant(idp, idp_user_xid="claimant-2")
        claim = Claim.initiate_with_swa_xid(swa, claimant, swa_xid)
        self.assertEqual(
            claim.events.filter(
                category=Claim.EventCategories.INITIATED_WITH_SWA_XID
            ).count(),
            1,
        )
        event = claim.events.filter(
            category=Claim.EventCategories.INITIATED_WITH_SWA_XID
        ).first()
        self.assertEqual(event.description, utc_swa_dt)
        self.assertEqual(event.happened_at, now_utc)
        self.assertFalse(claim.is_swa_xid_expired())

    def test_claim(self):
        ks_swa, _ = create_swa()
        idp = create_idp()
        claimant = create_claimant(idp)
        claim_uuid = "055594e0-3488-4b9d-942c-5203e7c1929f"
        claim = Claim(
            uuid=claim_uuid, swa=ks_swa, claimant=claimant, status="something"
        )
        claim.save()
        event_time = timezone.now()

        self.assertAlmostEqual(
            claim.should_be_deleted_after(),
            (
                claim.updated_at
                + timedelta(days=settings.DELETE_PARTIAL_CLAIM_AFTER_DAYS)
            ),
        )

        claim.events.create(
            category=Claim.EventCategories.STORED,
            happened_at=event_time,
            description="wassup",
        )
        claim.events.create(
            category=Claim.EventCategories.SUBMITTED,
            happened_at=event_time + timedelta(hours=1),
            description="right",
        )

        with self.assertRaises(ProtectedError):
            # swa cannot be deleted if it has a claim
            ks_swa.delete()

        with self.assertRaises(ProtectedError):
            # claimant cannot be deleted if it has a claim
            claimant.delete()

        stored_claim = Claim.objects.get(uuid=claim_uuid)
        self.assertEqual(stored_claim.swa, ks_swa)
        self.assertEqual(stored_claim.claimant, claimant)
        self.assertEqual(stored_claim.status, "something")
        self.assertFalse(stored_claim.is_completed())
        self.assertEqual(stored_claim.status_for_claimant(), CLAIMANT_STATUS_IN_PROCESS)

        claim.events.create(
            category=Claim.EventCategories.COMPLETED,
            happened_at=event_time + timedelta(minutes=1),
        )
        self.assertTrue(claim.is_completed())
        self.assertTrue(stored_claim.is_completed())
        self.assertEqual(stored_claim.status_for_claimant(), CLAIMANT_STATUS_PROCESSING)
        self.assertFalse(stored_claim.should_be_deleted_after())

        self.assertEqual(
            stored_claim.public_events(),
            [
                {
                    "category": "Stored",
                    "happened_at": str(event_time),
                    "description": "wassup",
                },
                {
                    "category": "Completed",
                    "happened_at": str(event_time + timedelta(minutes=1)),
                    "description": "",
                },
                {
                    "category": "Submitted",
                    "happened_at": str(event_time + timedelta(hours=1)),
                    "description": "right",
                },
            ],
        )

        # calling change_status() creates an Event
        claim.change_status("new status")
        self.assertEqual(
            json_decode(claim.events.last().description),
            {"old": "something", "new": "new status"},
        )

    def test_claim_status_for_claimant(self):
        swa, _ = create_swa()
        idp = create_idp()
        claimant = create_claimant(idp)

        cancelled_claim = Claim(swa=swa, claimant=claimant)
        cancelled_claim.save()
        cancelled_claim.events.create(category=Claim.EventCategories.COMPLETED)
        cancelled_claim.events.create(category=Claim.EventCategories.RESOLVED)
        cancelled_claim.events.create(category=Claim.EventCategories.DELETED)
        self.assertEqual(
            cancelled_claim.status_for_claimant(), CLAIMANT_STATUS_CANCELLED
        )
        self.assertTrue(cancelled_claim.is_resolved())
        self.assertTrue(cancelled_claim.is_deleted())
        self.assertTrue(cancelled_claim.deleted_at())
        self.assertFalse(cancelled_claim.resolution_description())

        resolved_claim = Claim(swa=swa, claimant=claimant)
        resolved_claim.save()
        resolved_claim.events.create(category=Claim.EventCategories.COMPLETED)
        resolved_claim.events.create(category=Claim.EventCategories.FETCHED)
        resolved_claim.events.create(category=Claim.EventCategories.DELETED)
        resolved_claim.events.create(
            category=Claim.EventCategories.RESOLVED, description="good stuff"
        )
        self.assertEqual(resolved_claim.status_for_claimant(), CLAIMANT_STATUS_RESOLVED)
        self.assertTrue(resolved_claim.is_resolved())
        self.assertTrue(resolved_claim.resolved_at())
        self.assertEqual(resolved_claim.resolution_description(), "good stuff")

        active_claim = Claim(swa=swa, claimant=claimant)
        active_claim.save()
        active_claim.events.create(category=Claim.EventCategories.COMPLETED)
        active_claim.events.create(category=Claim.EventCategories.FETCHED)
        self.assertEqual(active_claim.status_for_claimant(), CLAIMANT_STATUS_ACTIVE)
        self.assertTrue(active_claim.is_fetched())
        self.assertTrue(active_claim.fetched_at())

        processing_claim = Claim(swa=swa, claimant=claimant)
        processing_claim.save()
        processing_claim.events.create(category=Claim.EventCategories.COMPLETED)
        self.assertEqual(
            processing_claim.status_for_claimant(), CLAIMANT_STATUS_PROCESSING
        )

        deleted_claim = Claim(swa=swa, claimant=claimant)
        deleted_claim.save()
        deleted_claim.events.create(category=Claim.EventCategories.DELETED)
        self.assertEqual(deleted_claim.status_for_claimant(), CLAIMANT_STATUS_DELETED)

    def test_events(self):
        idp = create_idp()
        claimant = create_claimant(idp)
        ks_swa, _ = create_swa()
        claim = Claim(swa=ks_swa, claimant=claimant)
        claim.save()

        event_time = timezone.now()
        claim_event = claim.events.create(
            category=Claim.EventCategories.STORED, happened_at=event_time
        )
        self.assertIsInstance(claim_event.happened_at, datetime.datetime)
        self.assertEqual(
            claim.events.filter(category=Claim.EventCategories.STORED).all()[0],
            claim_event,
        )
        self.assertEqual(claim_event.get_category_display(), "Stored")
        self.assertEqual(
            claim_event.as_public_dict(),
            {
                "happened_at": str(event_time),
                "category": "Stored",
                "description": "",
            },
        )

        yesterday = timezone.now() - timedelta(days=1)
        claimant_event = claimant.events.create(
            category=Claimant.EventCategories.LOGGED_IN, happened_at=yesterday
        )
        self.assertEqual(
            claimant.events.filter(category=Claimant.EventCategories.LOGGED_IN).all()[
                0
            ],
            claimant_event,
        )
        self.assertEqual(claimant_event.get_category_display(), "Logged In")
        self.assertEqual(claimant_event.happened_at, yesterday)

        # our enum is not enforced, so exercise the error case
        unknown_event = claim.events.create(category=0)
        self.assertEqual(unknown_event.get_category_display(), "Unknown")


class ApiModelClaimArtifactsTestCase(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        create_s3_bucket()

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        delete_s3_bucket()

    def test_claim_delete_artifacts(self):
        idp = create_idp()
        claimant = create_claimant(idp)
        ks_swa, _ = create_swa()
        claim = Claim(swa=ks_swa, claimant=claimant)
        claim.save()
        claim.events.create(category=Claim.EventCategories.COMPLETED)
        cw = ClaimWriter(claim, "test")
        cw.write()
        logger.debug("🚀 wrote claim")

        # failure to read an artifact that we know does not exist (the partial claim) does NOT
        # populate the error logs
        # unittest.assertNoLogs only exists at Python >= 3.10 so we cannot use it here.
        with self.assertRaises(AssertionError) as context:
            with self.assertLogs(level="ERROR") as cm:
                resp = claim.delete_artifacts()
                self.assertEqual(resp, SUCCESS)
            self.assertIn(
                "no logs of level ERROR or higher triggered on root",
                str(context.exception),
            )

        # if boto3 is unable to delete the same number of objects we expect,
        # the error is logged and we return failure
        with patch("core.claim_storage.ClaimReader.exists") as mock_reader_exists:
            mock_reader_exists.return_value = True
            with patch("core.claim_storage.ClaimStore.bucket") as mock_boto3_bucket:
                bucket = boto3.resource("s3").Bucket("no-such-bucket")
                stubber = Stubber(bucket.meta.client)
                delete_objects_response = {
                    "Deleted": [],
                    "Errors": [
                        {"Key": "bad thing"},
                    ],
                }
                stubber.add_response("delete_objects", delete_objects_response)
                stubber.activate()
                mock_boto3_bucket.return_value = bucket

                with self.assertLogs(level="ERROR") as cm:
                    resp = claim.delete_artifacts()
                    self.assertIn(
                        "ERROR:api.models.claim:[{'Key': 'bad thing'}]", cm.output[0]
                    )
                    self.assertEqual(resp, FAILURE)

            with patch("core.claim_storage.ClaimStore.bucket") as mock_boto3_bucket:
                bucket = boto3.resource("s3").Bucket("no-such-bucket")
                stubber = Stubber(bucket.meta.client)
                delete_objects_response = {
                    # no Deleted key at all
                    "Errors": [
                        {"Key": "bad thing"},
                    ]
                }
                stubber.add_response("delete_objects", delete_objects_response)
                stubber.activate()
                mock_boto3_bucket.return_value = bucket

                with self.assertLogs(level="ERROR") as cm:
                    resp = claim.delete_artifacts()
                    self.assertIn(
                        "ERROR:api.models.claim:[{'Key': 'bad thing'}]", cm.output[0]
                    )
                    self.assertEqual(resp, FAILURE)

        # if we have some unknown failure, return it
        with patch("core.claim_storage.ClaimReader.exists") as mock_reader_exists:
            mock_reader_exists.return_value = True
            with patch(
                "core.claim_storage.ClaimStore.delete"
            ) as mocked_claimstore_delete:
                mocked_claimstore_delete.return_value = False
                resp = claim.delete_artifacts()
                self.assertEqual(resp, FAILURE)
