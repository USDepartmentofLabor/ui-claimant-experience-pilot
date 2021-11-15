# SWA API Authentication

- Status: In process
- Deciders: Team consensus
- Date: 2021-10-14

The SWA API allows state agencies to manage claims submitted via the Claimant API. In order to use the API,
SWA API clients must be able to authenticate without human intervention, as they will be running on an
automated schedule.

Just as with encryption, the typical patterns for this kind of machine-to-machine API authentication rely on either a shared secret
(e.g. API key, OAuth2) or an asymmetrical key pair (e.g. JWT signed with private key, verified with public key).

Some OAuth2 solutions may also make the use of [AWS API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
both possible and favorable.

## Considered Alternatives

- Single shared API token per SWA
- OAuth2 using existing DOL Active Directory as identity provider
- OAuth2 using AWS Cognito as identity provider
- OAuth2 using self-hosted Django identity provider
- JWT with asymmetrical keys

## Pros and Cons of the Alternatives

### Single shared API token per SWA

- `+` Simple to understand and manage
- `-` Plaintext token is easiest to compromise, either at rest or in transit
- `-` Shared key increases attack surface

### OAuth2 using existing DOL Active Directory

- `+` OAuth is a well known protocol
- `+` DOL already has the service
- `-` Requires extensive reliance on the Azure environment and products, some of which may require complex integrations with our system
- `-` Shared key increases attack surface

### OAuth2 using AWS Cognito

- `+` OAuth is a well known protocol
- `+` AWS Cognito is FedRAMPed
- `+` Can leverage AWS API Gateway to confirm access tokens
- `-` No existing use of AWS Cognito at DOL, so a new product to learn/support
- `-` Additional cost
- `-` Shared key increases attack surface

### OAuth2 using self-hosted identity provider

- `+` OAuth is a well known protocol
- `+` Multiple [ready-made solutions](https://djangopackages.org/grids/g/oauth-servers/) available for Django
- `+` One less external service to learn and manage (we control our own destiny)
- `-` Hosting our own authentication increases security exposure (e.g. storing client secrets)
- `-` Dependence on a volunteer-driven open source solution for a key piece of security infrastructure
- `-` Shared key increases attack surface

### JWT with asymmetrical keys

- `+` JWT and asymmetrical encryption are [well known technologies](https://learn.akamai.com/en-us/webhelp/iot/jwt-access-control/GUID-CB17F8FF-3367-4D4B-B3FE-FDBA53A5EA02.html)
- `+` Similar pattern to Open ID Connect that our Claimant identity providers will be using
- `+` Does not require separate authentication step to acquire an access token. The JWT access token contains everything necessary to authenticate and authorize an API request.
- `+` No password (shared secret) so attack surface is cut in half
- `+` Unique access token on every request so requests cannot be re-played
- `+` We are already using JWT/JWE and asymmetrical for PII encryption (libraries already required)
- `+` We are already managing SWA public keys
- `+` SWAs need only manage one secret (their private key) rather than additional OAuth credentials
- `+` Strong evidence that the SWA has ongoing access to the key required to decrypt Claims
- `-` Absence of existing Django implementations ([one example](https://github.com/crgwbr/asymmetric-jwt-auth))
- `-` Requires [rigorous security checks](https://www.pingidentity.com/en/company/blog/posts/2019/jwt-security-nobody-talks-about.html) beyond signature matching

## Decision Outcome

JWT signed with asymmetrical keys for MVP, at minimum.

OAuth2 using AWS Cognito for longer term, but likely out of scope for MVP.

In the long run, both methods can be used together, providing a multi-step authentication for SWAs.

As a security mitigation, we can also add IP safelists to restrict traffic to authorized SWA networks. This applies
regardless of which authentication pattern is implemented.
