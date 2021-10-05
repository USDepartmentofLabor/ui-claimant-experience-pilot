# Git repository hosting

- Status: Decided
- Deciders: OCIO
- Date: 2021-08-12

We need a centralized Git repository.

## Considered Alternatives

- DOL-hosted GitLab
- Public GitHub DOL organization

## Pros and Cons of the Alternatives

### DOL-hosted GitLab

- `+` Already provisioned and integrated with deployment infrastructure.
- `-` Only available from DOL network, which limits collaboration and local development options.

### Public GitHub DOL organization

- `+` Already provisioned and in use by DOL.
- `+` Allows for widest collaboration and maximum flexibility in local development.
- `-` Requires some additional configuration for either replication to DOL internal GitLab and/or Jenkins.

## Decision Outcome

Public GitHub. The advantages of flexibility, open-ness and collaboration outweighed deployment/infra concerns.

We are starting with a private repository, open to open-sourcing (making public) upon future review.
