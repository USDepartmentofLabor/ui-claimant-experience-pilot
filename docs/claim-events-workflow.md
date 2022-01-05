# Claim Events workflow

During the lifecycle of a Claim, we create Event records to track the workflow. This document describes each Event category
and when each is created. Though some attempt is made to list these in chronological order according to the workflow,
some Events will occur multiple times (e.g. `SUBMITTED`) and due to async processing, some may happen out of the order they
are listed here (e.g. `CONFIRMATION_EMAIL` and `FETCHED`).

## SUBMITTED

Each time a subsequent `POST` is made to the `/api/claim/` endpoint, create a `SUBMITTED` Event.
Generally, `SUBMITTED` events reflect the "save and continue" pattern on the frontend.

## STORED

Whenever a Claim is written to S3, create a `STORED` Event. We expect to see `SUBMITTED` and `STORED` Events in very close temporal proximity.
If we don't, there is something amiss with our S3 storage pattern (misconfiguration, network latency, etc) that might suggest we need
to change our approach.

## COMPLETED

When a Claim is ready for a SWA to fetch, create a `COMPLETED` Event. This means the Claim has been asymmetrically encrypted
and written to the S3 bucket. If `claim.is_complete()` returns true, that means a `COMPLETED` Event exists.

## CONFIRMATION_EMAIL

When a confirmation email is sent to the Claimant about their Claim, this Event is created.

## FETCHED

When a SWA wants to remove a Claim from its queue of to-be-processed Claims, it can `PATCH` a request to mark the Claim as fetched.
The `FETCHED` Event indicates that the SWA has taken ownership of the Claim. Claims with `COMPLETED` and `FETCHED` Events should
not be returned as part of the SWA Claim queue.

## RESOLVED

When a SWA has reached the final state of a Claim in its system of record, it should mark the Claim as `RESOLVED` in the USDOL system.
The `description` of the `RESOLVED` event is an optional string supplied by the SWA that should describe the reason for the resolution.

## DELETED

When a SWA wants us to destroy the encrypted sensitive Claim data we have stored, then can send a `DELETE` HTTP request via our API.
We will remove the encrypted artifacts and create the `DELETED` Event to track the action.

## STATUS_CHANGED

When a SWA sends a `PATCH` request to change the status of a Claim, the `STATUS_CHANGED` Events tracks the action.
