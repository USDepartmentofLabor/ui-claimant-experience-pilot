# Public Key Management

- Status: Decided
- Deciders: Team consensus
- Date: 2021-10-19

SWAs generate a public/private RSA key pair, keep the private key, and must register the public key with our application.

We need a process for managing those public keys that is both convenient for SWAs, and safe and reliable for application
administrators. We want the process to validate the integrity of the public key and automatically register it
and its fingerprint with the SWA data model.

## Considered Alternatives

- Provide a `make` target + script
- Provide a web interface for administrators
- Expose an API for SWAs
- Provide a self-service web interface for SWAs

## Pros and Cons of the Alternatives

### Provide a `make` target + script

- `+` Easy to maintain as part of the code base
- `-` Requires command-line access to the application in production environments, so requires ESD ticket
- `-` Running terminal commands manually in production can be slightly more error-prone

### Provide a web interface for administrators

- `+` Convenient for both developers and operations personnel
- `+` Security: allows us to rotate keys very quickly
- `-` Requires yet another authentication mechanism, specific to administrators
- `-` Security: increases the attack surface of the application

### Expose an API for SWAs

- `+` SWAs can rotate their own public keys
- `±` Registering a new public key immediately invalidates the previous private key for future API authentication
- `-` Chicken and egg problem: the first public key registration must still be performed by a DOL administrator

### Provide a self-service web interface for SWAs

- `+` Most convenient for everyone
- `±` Registering a new public key immediately invalidates the previous private key for future API authentication
- `-` Requires yet another authentication mechanism (though it might be leveraged for API auth as well)

## Decision Outcome

At minimum, provide a `make` target + script in order to make development and testing possible. That's the tablestakes
implementation.

If an application administrator web authentication mechanism is implemented in the future, add SWA management (including
public keys) at that point.

Self-service SWA interface is beyond the scope of the MVP.
