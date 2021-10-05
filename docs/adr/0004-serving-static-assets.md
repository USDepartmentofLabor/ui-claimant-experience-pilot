# Serving Static Assets

- Status: Decided
- Deciders: Team consensus
- Date: 2021-08-18

The SPA React app and standalone static home page, along with their supporting asset files (css/js/img), need to be
served from a web server.

We assume that Akamai will be the TLS termination point for the public facing site. This ADR answers the question:
if Akamai is the CDN, what is the origin?

## Considered Alternatives

- S3 bucket
- Standalone Docker container with NGINX
- Include static assets within a Django API container
- Akamai NetStorage

## Pros and Cons of the Alternatives

### S3 bucket

- `+` Simple to deploy and scale
- `-` S3 is not currently exposed to the internet over HTTPS given the DOL network topology. Workarounds might include CloudFront, but that is currently not on the approved DOL list.

### Standalone Docker container with NGINX

- `+` NGINX is a well-known technology, and straightfoward to configure for static files
- `+` Deployment is containerized, just like the backend API
- `+` Frontend code is managed independently of backend code
- `-` Local development will require managing multiple repos
- `-` Requires a separate domain name from the API app (certs, cookies, CORS, etc)

### Serve static assets from Claimant Django API app

- `+` Deploying the "Claimant application" is monolithic (versioning always in sync)
- `+` A single NGINX configuration to manage
- `+` Local development requires only a single repo
- `+` Single domain name to manage (certs, cookies, CORS, etc)
- `-` Tightly coupling the frontend and backend code may make code management trickier to coordinate on a larger team

### Akamai NetStorage

- `+` DOL already using it
- `+` Zero scaling management overhead (Akamai takes care of that)
- `+` Frontend code is managed independently of backend code
- `-` Local development will require managing multiple repos
- `-` ?? Domain name management
- `-` CI/CD does not currently support pushing content into NetStorage

## Decision Outcome

Serve static assets from Claimant Django API app.

This keeps all the application assets together in one place for ease of development, while still allowing for flexibility in deployment.
Different scaling needs can be mitigated using Akamai's CDN caching of static assets.
