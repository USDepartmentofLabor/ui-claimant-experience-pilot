# Long-term PII storage

- Status: Decided
- Deciders: Team consensus
- Date: December 16, 2021

DOL has an interest in maintaining claimant data beyond its usage for the Claimant Experience Pilot. This ADR addresses how the system will enable DOL to maintain a copy of claims indefinitely.

## Assumptions

Existing ADRs have established that final claims data will be stored in an S3 bucket with asymmetric encryption and will only be accessible to the state in which a claimant files for UI. This data is solely for the use of states and may be deleted at the behest of states (and in accordance with data retention policies). Any solution that enables DOL to access claims data indefinitely will be separate from the states' claims data.

The Claimant Experience Pilot should not have read access to the long-term data store and other DOL consumers must make decisions regarding data retention, Extract-Transform-Load (ETL) operations to other systems, and logging and auditing associated with the data store.

Long-term, centralized PII storage will result in increased risk that DOL must accept:

- An indefinite DOL data store will consist of more data than the ephemeral state S3 bucket. Unauthorized access of this data store therefore will expose more data than would have been exposed by access to the state S3 bucket.
- Unauthorized access to DOL infrastructure may result in gaining full access to data in the DOL data store and the ability to decrypt it. This represents easier access to the data than the state S3 bucket, where access would not only be needed to the bucket but also the private keys maintained by each state.

## Constraints

Since final claims data will be encrypted asymetrically in an S3 bucket using states' public keys, giving DOL access to this bucket (or a replica) is not feasible because DOL would be unable to decrypt the state-bound claims.

## Considered Alternatives

- A separate S3 bucket with claims encrypted using a DOL-owned asymmetric keypair
- A separate S3 bucket with claims encrypted using AWS Key Management Service (KMS)
- Deferring long-term data storage to future pilot efforts

## Pros and Cons of the Alternatives

### Separate S3 bucket, DOL-owned asymmetric keypair

In this solution, a separate S3 bucket will be created for DOL. When a claim is submitted to a state, a separate copy of the claims data will be encrypted with a DOL public key and stored in the DOL S3 bucket. When DOL wants access to this data, it retrieves the data from the S3 bucket and uses its private key for decryption.

- `+` The Claimant Experience Pilot application does not have access to the data long-term
- `+` Works much like state data encryption, which has already been implemented in the Claimant Experience Pilot
- `+` Can be used to meet data retention requirements
- `-` DOL must safeguard a private key. If lost, DOL would be unable to decrypt the stored data.
- `-` DOL must accept the risk associated with maintaining large amounts of claimant data

### Separate S3 bucket, AWS KMS-managed keypair

In this solution, a separate S3 bucket will be created for DOL. The S3 bucket will have KMS-based encryption enabled and will use a Customer-Managed Key (CMK). The Claimant Experience Pilot application will be given encryption (but not decryption) permissions for that CMK. Any user (human or machine) that may need access to the data in the S3 bucket can be given decryption permission on the CMK, either on a temporary or permanent basis. When a claim is submitted to a state through the Claimant Experience Pilot, a separate copy of the claims data will be stored in the DOL S3 bucket and will automatically be encrypted using the KMS CMK.

- `+` The Claimant Experience Pilot application does not have access to the data long-term
- `+` The burden of cryptographic key management is moved to an established key management service
- `+` Access to keys in KMS can be managed through typical AWS Identity and Access Management (IAM) mechanisms with which DOL operations personnel are familiar
- `+` KMS includes built-in logging and auditing mechanisms
- `+` Can be used to meet data retention requirements
- `-` KMS has not been implemented yet for the Claimant Experience Pilot and represents an unknown amount of additional coordination and development work
- `-` DOL must accept the risk associated with maintaining large amounts of claimant data

### Defer to future pilot efforts

This option represents a strategy that minimizes scope and risk near-term and defers some of the trickier data security and governance pieces for a future pilot.

- `+` Reduces security exposure
- `+` Does not affect the Claimant Experience Pilot
- `+` Makes space for a more focused effort on centralized data
- `+` Avoids maintaining duplicate and potentially divergent copies of state-owned data
- `-` Prevents DOL from being able to analyze claims data collected through the Claimant Experience Pilot
- `-` Will need to find another solution to meed data retention requirements

## Decision Outcome

- A separate S3 bucket with claims encrypted using AWS Key Management Service (KMS)
