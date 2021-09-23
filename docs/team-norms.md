# Norms for teams that use GitHub

This template is designed as a list of examples, questions and/or prompts for teams to discuss as they build norms around using GitHub.

## Repo layout

We prefer a directory layout that looks like:

* README.md
* CONTRIBUTING.md
* LICENSE
* core (Django application)
* initclaim (React application)
* ... other Django applications as the app evolves

## Fork or branch

For our project, we prefer that pull requests originate from branches within the main repo.

## Branch naming

When creating branches within a shared repo, our naming conventions look like *ticketnumber-myinitials-feature-name*

## Creating PRs

When we create new Pull Requests, we have the following conventions.

### WIP

GitHub "Draft" feature is our preferred way of marking a PR as not yet ready for review, but capable of taking advantage of CI/CD and GH Actions.

### Assignments

New PRs should be assigned to the person who opens the PR.

Once a PR is ready for review, Reviewers can be assigned based on familiarity with the feature space and/or availability.

## Reviewing PRs

Reviewing each other's code is one of the most important [collaborative efforts](https://medium.com/swlh/improving-your-teams-code-review-culture-a76cc82621e6) that development teams tackle and can come to define the daily culture of our work. Some common expectations should include:

### Who performs the review

We expect any engineer can perform a review, and make known as part of the review whether they have any limitations. For example,
if the change involves a language with which you are less familiar, or touches on business logic that requires some subject matter
expertise, it is completely fair to review what you can and qualify your comments with what you believe needs another set of eyes.

### What's involved in the review

We have a bias for approving, not rejecting, pull requests. Momentum and velocity are important team qualities. That said,
we prefer framing our review comments as a question, thought or change request. We indicate whether each comment is blocking or non-blocking.

If there is runnable code in the PR, as part of the review we will download and execute the code. We expect that the submitter
will provide comments in the PR description or in-line in a self-review about how the code should be tested and/or executed. If the reviewer has not run the code
locally, we expect a reviewer to say so explicitly in their review.

### How quickly do we expect a response to our request for a code review

We expect acknowledgement of the PR being opened and available for review within 24 hours. The actual review may take longer; it's the communication and expectation alignment
that is key. It's fair to ping reviewers on Slack with a link to the PR, since email notifications can be less reliable/timely.

## Issues

All project issues are tracked using internal DOL JIRA. We do not currently use GitHub Issues for this repository. Depending on if/when the repo is made public, we will revisit that question.

## Wiki

The Wiki is currently available, but we have a strong preference for documentation to exist as .md files checked in to the repository. The wiki is good for developing documentation
and lower barrier to entry.

## Administration

### Who are the administrators?

DOL OCIO has ownership privileges. Team assignment is made by emailing OCIO contacts with GitHub username and DOL email address.

### How are administrative changes decided and communicated?

Team members have administrative powers on the repo. Changes should be clarified in Slack and/or JIRA tickets, depending on the scope of the change.

## Code linting

We use [flake8](https://github.com/USDOLEnterprise/ARPAUI/blob/main/.flake8), [black](https://github.com/USDOLEnterprise/ARPAUI/blob/main/.pre-commit-config.yaml#L3),
[eslint](https://github.com/USDOLEnterprise/ARPAUI/blob/main/initclaim/.eslintrc.yml), and prettier. (TODO link)

For more details on linting see the [pre-commit config](https://github.com/USDOLEnterprise/ARPAUI/blob/main/.pre-commit-config.yaml).
