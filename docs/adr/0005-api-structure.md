# API Structure

- Status: Decided
- Deciders: Team consensus
- Date: 2021-09-22

The Pilot application will need to serve two distinct groups of users: Claimants and SWAs. Each user group will
require some kind of API. Some salient facts:

- The APIs may have significantly different scaling needs. The total number of concurrent
  Claimants could be 1000+ times greater than SWAs.
- The APIs will need to communicate with the same data stores (RDS, S3, ElastiCache).
- Due to differing business use cases, the APIs may have different computing resource needs. E.g. a SWA API request may take 30 seconds
  to complete a query and fetch of submitted claims, while a single Claimant API request should never take longer than a second or two.
- Managing multiple codebases can increase developer cognitive overhead tax.
- DOL deployment and change management constraints place a relatively high cost (time) on deploying a single application to production.

## Considered Alternatives

- Create a separate Django project for the SWA API (microservices)
- Include the SWA API and Claimant API in a single Django project (monolith)

## Pros and Cons of the Alternatives

### Create a separate Django project for the SWA API

- `+` independent deployment and scaling
- `+` enforced separation of concerns could allow for engineering teams to work in parallel ([SOA](https://en.wikipedia.org/wiki/Service-oriented_architecture) principles)
- `-` higher cognitive tax on developers
- `-` multiple application deployments increases time cost with DOL infra
- `-` the two APIs need to share a data model
- `-` the two APIs would require duplicate configuration for talking to the same data stores

### Include the SWA API and Claimant API in a single Django project

- `+` single deployment reduces friction with DOL infra
- `+` single codebase reduces developer cognitive tax
- `+` single data model reduces number of code lines to manage
- `+` single set of data store configuration to manage
- `-` scaling is tightly coupled
- `-` leans heavily on team discipline to keep concerns properly encapsulated

## Decision Outcome

Given the timeline constraints, use a single Django project. The APIs can be implemented as separate applications within the project,
to make it easier to split them into separate projects as a later date. We do not yet know the performance impact of serving two APIs from the same
container. Certainly during the Pilot capacity/load will be much smaller than an eventual nationwide deployment, so we can use the Pilot
phase to measure resource usage and constraints and determine if separate scaling is an actual or perceived concern.

To mitigate the risks of later splitting a monolithic application into separate services, we will take ongoing special care
to encapsulate business and data model logic within the relevant Django applications, to make it easier to pick-up-and-move
later if necessary.
