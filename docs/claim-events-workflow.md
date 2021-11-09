# Claim Events workflow

During the lifecycle of a Claim, we create Event records to track the workflow. This document describes each Event category
and when each is created. Though some attempt is made to list these in chronological order according to the workflow,
some Events will occur multiple times (e.g. `SUBMITTED`) and due to async processing, some may happen out of the order they
are listed here (e.g. `CONFIRMATION_EMAIL` and `FETCHED`).

## STARTED

Create this Event on the first time a `POST` is made to the `/api/claim` endpoint. It indicates that the Claimant
has started filling out the initial claim form.

## SUBMITTED

After a `STARTED` Event exists, each time a subsequent `POST` is made to the `/api/claim` endpoint, create a `SUBMITTED` Event.
Generally, `SUBMITTED` events reflect the "save and continue" pattern on the frontend.

## STORED

Whenever a Claim is written to S3, create a `STORED` Event. Unless the submitted Claim data is invalid (e.g. fails to conform
with the schema) then we expect to see `SUBMITTED` and `STORED` Events in very close temporal proximity.

## COMPLETED

When a Claim is ready for a SWA to fetch, create a `COMPLETED` Event. This means the Claim has been asymmetrically encrypted
and written to the S3 bucket. If `claim.is_complete()` returns true, that means a `COMPLETED` Event exists.

## CONFIRMATION_EMAIL

When a confirmation email is sent to the Claimant about their Claim, this Event is created.

## FETCHED

When a SWA wants to remove a Claim from its queue of to-be-processed Claims, it can `PUT` a request to mark the Claim as fetched.
The `FETCHED` Event indicates that the SWA has taken ownership of the Claim. Claims with `COMPLETED` and `FETCHED` Events should
not be returned as part of the SWA Claim queue.

## DELETED

When a SWA wants us to destroy the encrypted sensitive Claim data we have stored, then can send a `DELETE` HTTP request via our API.
We will remove the encrypted artifacts and create the `DELETED` Event to track the action.
