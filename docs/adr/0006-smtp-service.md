# SMTP service

* Status: Decided
* Deciders: Team consensus
* Date: 2021-09-28

The MVP application requires basic SMTP transactional service support.

## Considered Alternatives

* Procure a SaaS transactional email service (e.g. AWS SES, SendGrid, Mandrill, Mailgun)
* Use the existing DOL SMTP service

## Pros and Cons of the Alternatives

### Procure a SaaS transactional email service

* `+` SaaS vendor means we don't need to worry about scaling, performance, and ISP safelist management
* `-` Requires a procurement of unknown timeline

### Use the existing DOL SMTP service

* `+` Already integrated with WCMS, DKIM, SPF security
* `-` Unknown whether it can scale to the levels expected when we go to a nationwide rollout

## Decision Outcome

Use the existing DOL SMTP service for now, since it already works and does not pose a risk to MVP timeline.
Code will be written to change configuration only should we need to change providers.

During MVP we will evaluate performance and estimate whether we think a future procurement should be necessary.
Some criteria should include:

* scaling volume
* measuring delivery rate (something SaaS provides)
* ISP blocklist management (something SaaS provides)
