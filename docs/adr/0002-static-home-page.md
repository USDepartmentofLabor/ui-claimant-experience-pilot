# Separate static home page

- Status: Decided
- Deciders: Team consensus
- Date: 2021-08-16

100% of web traffic to the UI claimant application site will hit the home page. The home page should not require authentication
or dynamic content.

## Considered Alternatives

- Build home page as part of the SPA
- Split home page into a standalone static HTML file
- Use CMS

## Pros and Cons of the Alternatives

### Build home page as part of the SPA

- `+` Integrated development and deployment processes
- `+` Fewer components to manage
- `+` Single visual presentation to manage
- `-` Requires downloading the entire SPA to render a static page
- `-` We expect home page to not be interactive beyond simple JS animations, menus, etc. (USWDS)

### Split home page into a standalone static HTML file

- `+` Allows static anonymous page to scale with traffic stampede
- `+` Encourages bright line between anonymous and authenticated content
- `+` Content could be edited and tested by non-developers
- `-` Possibly 2x development work for visual style changes
- `-` Separate deployment process

### Use existing CMS

- `+` DOL has existing CMS infrastructure and content workflows
- `+` Leverage existing visual presentation infrastructure
- `-` Risk of dynamic content logic slipping into the home page
- `-` A CMS for a single page seems like a lot of technical overhead

## Decision Outcome

Split home page into a standalone static HTML file.

This separates the claimant form application from the front-door unauthenticated page, allowing them to scale and deploy
separately. If the content on the unauthenticated piece reaches sufficient complexity over time, a CMS could be substituted
eventually, without needing to alter the claimant form application code or deployment.
