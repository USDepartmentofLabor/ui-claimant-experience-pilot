# Initial Identity Provider

* Status: Decided
* Deciders: Team consensus
* Date: 2021-09-09

Goal 1 of the project calls for identifying an initial identity provider (IdP) to be integrated into the application
as part of Goal 2. The selection process is complex because even though we have three BPA-approved IdPs,
selecting a single IdP requires a procurement, with all the attendant risks to our tight timeline.

## Considered Alternatives

* Wait for the procurement process to conclude, implement one IdP and require it for all build/pilot State Workforce Agency (SWA) partner(s)
* Begin the procurement process for all BPA-approved IdPs, deferring selection(s) until after dialogue with build/pilot SWA partner(s)
* Begin the procurement process, and simultaneously implement the login.gov sandbox flow

## Pros and Cons of the Alternatives

### Wait for the procurement process to conclude, implement one IdP and require it for all build/pilot SWA partner(s)

* `+` No wasted engineering work
* `-` We will likely not finish procurement in time to implement for Goal 2
* `-` Any design prototyping that relies on the IdP flow will be blocked until implementation
* `-` Disrespects the discovery process with build/pilot SWAs

### Begin the procurement process for all BPA-approved IdPs, deferring selection(s) until after dialogue with build/pilot SWA partner(s)

* `+` Respects the discovery process with build/pilot SWAs
* `+` Keeping our options open for all IdPs would allow us to leverage existing relationships any build/pilot SWAs may have
* `-` We will definitely not finish procurement and discovery in time to implement for Goal 2
* `-` Any design prototyping that relies on the IdP flow will be blocked until implementation

### Begin the procurement process, and simultaneously implement the login.gov sandbox flow

* `+` Respects the discovery process with build/pilot SWAs
* `+` login.gov sandbox is free for anyone with a .gov or .mil email address (not blocked on any procurement)
* `+` Any design prototyping that relies on the IdP flow is not blocked
* `+` We can finish for Goal 2
* `+` We learn what's required for OIDC integration, from an engineering perspective, making the next integration smoother
* `-` login.gov is likely not an option for production, so any code will be relevant only to dev/test environments

## Decision Outcome

Begin the procurement process, and simultaneously implement the login.gov sandbox flow. The procurement process could theoretically
result in all three vendors being selected and then selection for the order in which they are implemented is dependent entirely
on priorities in consultation with build/pilot SWAs. Given the tight timeline of the initial MVP, anything that unblocks design
and engineering iterations is a win.
