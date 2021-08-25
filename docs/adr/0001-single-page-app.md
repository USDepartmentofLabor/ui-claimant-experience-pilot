# Single page application

* Status: Decided
* Deciders: Team consensus
* Date: 2021-08-16

The unified UI claimant application will require a web frontend that provides an easy-to-use form with validation, including multiple file attachment uploads.
The form will have several logical sections/steps (pages) to complete. There are a couple of different approaches to developing this type of application.

## Considered Alternatives

* [Single page application](https://en.wikipedia.org/wiki/Single-page_application) (SPA), client-side rendering
* Multiple page, server-side rendering

## Pros and Cons of the Alternatives

### SPA

* `+` Separation of concerns allows for better scaling options
* `+` SPA patterns are well known throughout the software development industry
* `+` Once loaded by the browser, user experience is comparable to a native app
* `-` Slower initial page load for an SPA compared to page load time amortized over each server page
* `-` Requires a separate, more complex development and deployment path
* `-` JavaScript required

### Multiple server pages

* `+` Well known, (older) traditional pattern in the software development industry
* `+` Faster initial page load
* `+` Integrated development and deployment path
* `-` JavaScript required
* `-` Some JavaScript framework required else managing with jQuery alone will get ugly
* `-` Monolithic server application offers fewer scaling options
* `-` Depending on the logical form construction, some validation logic may link multiple steps (pages) tightly together
* `-` Higher architectural risk of mixing back-end business logic with presentation logic

## Decision Outcome

Single page application.

If we subsequently need JavaScript-free pages, we can render static form .html pages and deliver via the static file delivery mechanism.
They would not have any client-side validation.
