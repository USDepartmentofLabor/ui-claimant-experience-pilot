# Where We Store Claimant Personal Identifiable Information (PII)

- Status: Decided
- Deciders: Team consensus
- Date: 2021-10-05

From the moment a Claimant begins their interactions with our system, we will need to begin collecting data to track
the progress of their claim and the data that makes up the claim. Much of the claim data itself is PII.

We have a variety of storage products available to us within AWS, each with a set of strengths that make
it well-suited to particular use cases. In addition to scaling performance factors like redundancy, concurrency and
speed, the logical data architecture of the application should take into account business
factors like security, flexibility and referential integrity.

At minimum, the application will have three sets of data to store: the active web session tied to a specific Claimant on a specific
device, the prepared claim ready for shipment to a SWA. Both data sets will contain PII. The third data set is bookkeeping metadata
about the claim: events (started, finished, scanned, etc), what SWA is it destined for, the Identity Provider used to verify the Claimant, etc.

## Considered Alternatives

- Store everything in RDS
- Store session in Redis, everything else in RDS
- Store session in Redis, prepared claims in S3, claim processing metadata in RDS

## Pros and Cons of the Alternatives

### Store everything in RDS

- `+` Single data store to configure and manage
- `+` Referential integrity for those data that need it (e.g. bookkeeping metadata about claims).
- `-` Single "honeypot" of PII. A compromise would, at minimum, expose encrypted PII for all claims in progress and those not yet
  shipped to SWAs.
- `-` All PII will be encrypted at rest. Opaque encrypted text in a relational DB bypasses the usefulness of relational integrity constraints.
  Features like indexes and foreign keys are useless for blobs of ciphertext, so we trade the cost of storage and performance constraints
  on concurrency and potentially high transaction rates with few of the benefits of a relational system.

### Store session in Redis, everything else in RDS

- `+` Session is stored as a symmetrically encrypted text blob, ideally suited to a key/value store like Redis.
- `+` Session access is fast.
- `+` Session storage can be automatically expired (deleted), reducing exposure to compromise.
- `+` Referential integrity for those data that need it (e.g. bookkeeping metadata about claims).
- `+` A compromise to RDS or a backup snapshot file would not affect claims in progress.
- `-` All prepared claim PII will be encrypted at rest. See negative rationale for "Store everything in RDS".
- `-` A RDS compromise would, at minimum, expose encrypted PII for all claims not yet shipped to SWAs.

### Store session in Redis, prepared claims in S3, claim processing metadata in RDS

- `+` Same pros as "Store session in Redis, everything else in RDS"
- `+` No PII stored in RDS. We only keep persistent, relational data in the persistent, relational store.
- `+` Prepared claims in S3 means zero assembly overhead when SWAs ask for them. They are write-once and ready to ship.
- `+` S3 storage is cheaper than RDS, and we are not paying for RDS features we cannot use.
- `-` Most complex solution.

## Decision Outcome

Store session in Redis, prepared claims in S3, claim processing metadata in RDS.

**NOTE** that if we find we also need to persist claims-in-process, we can evaluate at that time whether Redis or S3 is most
appropriate. Among the factors to consider will be the trade-offs in architectural complexity vs security/privacy.
