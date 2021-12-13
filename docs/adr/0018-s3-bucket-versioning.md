# S3 bucket versioning, lifecycle policies

- Status: Decided
- Deciders: Team consensus
- Date: 2021-12-02

Existing ADRs have established that the Claimant Experience Pilot will use an S3
bucket to store in-progress and submitted claims. This ADR addresses whether to
use S3 bucket versioning on that bucket, and if so, whether to use lifecycle
policies to manage the expiration and cleanup of old objects that have either
been marked for deletion or are no longer needed after a certain amount of time.

Context on how versioning affects the behavior of adding or deleting objects:

- On a bucket with versioning enabled:
  - Adding a new version of an existing object does not remove the existing
    object. The versions are given unique IDs. The new version becomes "current"
    and the existing object becomes "noncurrent".
  - A simple delete operation does not permanently remove the object. It inserts
    a delete marker in the bucket, but still retains the original object.
- On a bucket without versioning enabled:
  - Adding a new version of an existing object replaces and removes the existing
    object.
  - A simple delete operation permanently removes the object.

One
[example](https://docs.aws.amazon.com/AmazonS3/latest/userguide/lifecycle-configuration-examples.html#lifecycle-config-conceptual-ex7)
of using versioning and lifecycle policies is to permanently remove noncurrent
versions after a certain amount of time (e.g., 30 days) and clean up delete
markers that have zero noncurrent versions (referred to as "expired object
delete markers").

References:

- [S3 bucket
  versioning](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Versioning.html)
- [S3 lifecycle
  policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)

## Assumptions

- Long-term PII storage requirements will be covered in other ADRs
- There are no long-term data retention requirements for the
  objects stored in the Claimant Experience Pilot's primary S3 bucket
- The data in the Claimant Experience Pilot's primary S3 bucket may be deleted
  at the behest of the states

## Constraints

For this ADR, the lifecycle policy particulars (e.g., when to delete old
versions) are out of scope.

## Considered Alternatives

- No versioning
- Versioning - without lifecycle policies
- Versioning - with lifecycle policies

## Pros and Cons of the Alternatives

### No versioning

- `+` Minimal configuration
- `+` Reduces storage costs, as there is only ever one version of an object being
  stored
- `+` Deleting a file permanently deletes it, without the need to delete any
  other versions
- `+` Could still use lifecycle policies to expire and clean up in-progress
  claims
- `±` Would only store most recent copy of in-progress claims
- `-` Objects inadvertently deleted cannot be recovered

### Versioning - without lifecycle policies

- `+` Minimal configuration
- `+` Objects inadvertently deleted can be restored
- `+` AWS Identity and Access Management (IAM) permissions be leveraged to
  increase protection against accidental deletion
- `+` IAM can be used to prevent the application from being able to view old
  versions of objects
- `+` Enables storing multiple versions of in-progress claims, although it is
  unclear whether the pilot has a use case for this
- `±` Old versions could be cleaned up through other means, but this could add
  complexity compared to the built-in AWS lifecycle policy features
- `-` Increased risk of storing old versions of symmetrically encrypted PII
  longer than needed

### Versioning - with lifecycle policies

- `+` Objects inadvertently deleted can be restored
- `+` AWS Identity and Access Management (IAM) permissions could be leveraged to
  increase protection against accidental deletion
- `+` IAM can be used to prevent the application from being able to view old
  versions of objects
- `+` Enables storing multiple versions of in-progress claims, although it is
  unclear whether the pilot has a use case for this
- `+` Uses built-in AWS features to manage versioning and expiration of objects
- `-` More complex configuration

## Decision Outcome

Use versioning with lifecycle policies to clean up deleted objects and
noncurrent versions. Versioning and AWS IAM can be used together to prevent
accidental deletion of claims. Lifecyle policies can be used to permanently
remove old object versions, addressing the risk of retaining symmetrically
encrypted PII. Further, AWS IAM can be used to prevent the application from
being able to read old versions of objects.
