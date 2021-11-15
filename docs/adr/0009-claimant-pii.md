# Storing Claimant Personal Identifiable Information (PII) encrypted at rest

- Status: Decided
- Deciders: Team consensus
- Date: 2021-10-04

We collect Claim data, including sensitive PII (SSN, DOB, financials) and hold it in escrow until such time as the
state agency (SWA) for which the Claim is intended retrieves the Claim from us.
We might hold it for a few seconds or several days -- it's up to the state agency to determine how frequently they poll our API.

Therefore we must encrypt the Claim data [at rest](https://en.wikipedia.org/wiki/Data_at_rest#Encryption) while it exists in our environment,
in order to prevent visibility in the event of unauthorized access or theft.

There are two main patterns for encrypting data: [symmetrical](https://en.wikipedia.org/wiki/Symmetric-key_algorithm) (shared secret)
or [asymmetrical](https://en.wikipedia.org/wiki/Public-key_cryptography) (public/private keys).
[Envelope encryption](https://ironcorelabs.com/docs/data-control-platform/concepts/envelope-encryption/) combines both patterns.

This ADR describes the general approach to encrypting PII. This ADR _does not attempt_ to describe compliance specifics such as:

- which specific NIST FIPS-140 controls we are following;
- what versions of transport security (TLS) are involved in data exchange;
- whether our approach is consistent with NIST 800-53 definitions.

## Considered Alternatives

- Symmetric encryption with a shared key used by all SWAs
- Symmetric encryption with a unique key per SWA
- Asymmetric encryption with a unique key pair per SWA (SWA holds private key, USDOL holds public key)
- Envelope encryption with a unique key pair per SWA

## Pros and Cons of the Alternatives

### Symmetric encryption with a shared key used by all SWAs

- `+` Simplest: one secret to manage everywhere
- `±` Symmetric means USDOL can access the PII at any time
- `-` A compromised secret anywhere is a compromise everywhere

### Symmetric encryption with a unique key per SWA

- `+` A single compromised SWA secret does not compromise all SWA secrets
- `±` Symmetric means USDOL can access the PII at any time
- `-` A USDOL compromise means all SWAs are compromised

### Asymmetric encryption with unique key pair per SWA

- `+` A USDOL compromise does not affect already-encrypted PII
- `+` A single compromised SWA private key does not compromise all SWA keys
- `±` Asymmetric means USDOL can only access the PII before it is encrypted
- `-` SWAs must generate their own key pairs
- `-` There is a limit on the size of the encrypted data (the limit is the key size).

### Envelope encryption with a unique key pair per SWA

- `+` A USDOL compromise does not affect already-encrypted PII
- `+` A single compromised SWA private key does not compromise all SWA keys
- `+` No limit on encrypted data size
- `±` Asymmetric means USDOL can only access the PII before it is encrypted
- `-` SWAs must generate their own key pairs
- `-` Most complex to understand and manage

## Decision Outcome

The envelope encryption pattern provides the best conformance with NIST [FIPS-140-3](https://csrc.nist.gov/publications/detail/fips/140/3/final) standards,
privacy defense and mitigation against compromised keys.

A sample workflow illustrates the pattern at work.

- SWA generates an asymmetric public/private key pair using ECDSA P-256.
- SWA gives USDOL the public key using out-of-band secure transmission (e.g. cryptographically signed email (DKIM)).
- Example PII is a JSON-encoded string.
- Create a 256-bit data encryption key (DEK) with a secure random generator.
- Symmetric ([AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)) encryption of the JSON PII using the DEK.
- Encrypt the DEK with the SWA public key (effectively making the public key the KEK (key encryption key)).
- Write the encrypted DEK and the encrypted PII string to a JSON file. Include any other metadata attributes in the JSON to communicate how to decrypt (e.g., version, IV (initialization vector), cipher name, date, fingerprint of the public key used, etc). Consider a standard structure like [JWE](https://datatracker.ietf.org/doc/html/rfc7516).
- After transmission to their local environment, SWA uses their private key to decrypt the DEK, and then uses the DEK to decrypt the original PII.

Top-level example for the JSON `claim` payload:

```js
{
  "version": "1.0",
  "schema": "uri for the JSON schema describing the contents of the claim.ciphertext once decrypted",
  "submitted_at": "yyyy-mm-dd hh:mm:ss UTC",
  "public_cert_id": "thumbprint of the public cert used for encryption",
  "claim_uuid": "xxxx-xxxx-xxxx-xxxx",
  "identity_assurance": "IAL2",
  "claim": { // JSON Web Encryption object -- see https://datatracker.ietf.org/doc/html/rfc7516#page-9
    "ciphertext": base64-encoded string,
    "encrypted_key": base64-encoded string,
    "iv": string,
    "protected": string,
    "tag": string
  }
}
```
