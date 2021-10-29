# Storing and encrypting in-progress Claims

- Status: Decided
- Deciders: Team consensus
- Date: 2021-10-26

Not every Claimant will complete an initial Claim application in single session. We must support incremental
saving of partial Claims, and persist those partial Claims in an encrypted state for some yet-to-be-determined period of time
(best guess is seven days).

This ADR assumes the PII [encryption](0008-claimant-pii.md) and [storage](0009-pii-storage.md) patterns
already established, specifically that we can store encrypted PII in either Redis or S3, and that in both cases it must
be stored using [symmetric encryption](0013-pii-backups.md) in order for us to later decrypt it.

## Considered Alternatives

- Store partial Claims in Redis
- Store partial Claims in S3
- Store partial Claims in Redis during live session, persisting them in S3

## Pros and Cons of the Alternatives

### Store partial Claims in Redis

- `+` Fast performance
- `-` Redis storage cannot be assumed to persist indefinitely, and is [definitely not atomic](https://docs.aws.amazon.com/AmazonElastiCache/latest/red-ug/RedisAOF.html)

### Store partial Claims in S3

- `+` Reliable storage for longer periods of time
- `-` Slower than Redis for active reads/writes, and likely unacceptable for UX

### Store partial Claims in Redis during live session, persisting them in S3

- `+` Fast for live sessions
- `+` Reliable for persistence over multiple days
- `-` Most complex solution

## Decision Outcome

A combination of Redis and S3 provides the best pairing of performance and reliability.

Some implementation elements to consider:

- [AWS KMS](https://aws.amazon.com/kms/) may provide some flexibility in supporting multiple, hardware-backed encryption keys
- [S3 encryption](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-encryption.html) is likely not enough, since access to the bucket
  automatically grants decryption powers. We will likely need to employ the same implementation strategy as we use for [PII backups](0013-pii-backups.md).
- Length of persistence and any automatic clean up is beyond the scope of this ADR
