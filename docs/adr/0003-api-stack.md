# API tech stack

* Status: Decided
* Deciders: Team consensus
* Date: 2021-08-16

The API server technology for the claimant form application will be deployed with Docker in the DOL Kubernetes (K8S) cluster.

The API server technology stack should leverage well-known, open source tools proven to scale well horizontally.

## Considered Alternatives

* [Flask](https://palletsprojects.com/p/flask/) (Python)
* [Django](https://www.djangoproject.com/) (Python)
* [Ruby on Rails](https://rubyonrails.org/) (Ruby)
* [Express](https://expressjs.com/) (JavaScript)

## Pros and Cons of the Alternatives

### Flask (Python)

* `+` Python is an existing language supported under DOL WCMS
* `-` Flask requires additional modules for mangaging sessions, ORM, templating and administration
* `-` Flask is a new framework at DOL

### Django (Python)

* `+` Python is an existing language supported under DOL WCMS
* `+` Django comes with built-in support for managing sessions, ORM, templating and administration
* `-` Django is a new framework at DOL

### Ruby on Rails (Ruby)

* `+` RoR comes with built-in support for managing sessions, ORM, templating and administration
* `-` Ruby is not an existing language supported under DOL WCMS

### Express (JavaScript)

* `+` JavaScript is an existing language supported under DOL WCMS
* `+` Same programming language for both frontend and backend applications
* `-` Express requires additional modules for mangaging sessions, ORM, templating and administration

## Decision Outcome

*Django offers the most robust feature set out of the box for a framework in a language currently supported by OCIO.*
This should provide the fastest path to deployment, in terms of existing infra, compliance and engineering resources,
and the best long-term maintenance option, given the fewer number of external dependencies to manage.

Both Flask and Express are lightweight, thin dispatcher frameworks that try to be unopinionated about how your web application
is implemented. You therefore have to pick a DB management library, auth/sessions, API patterns, etc. Unopinionated frameworks thus delegate
important opinions to the development team who starts a project, which can make it more difficult for subsequent teams to 
inherit the code and dependency maintenance.

Both Rails and Django include all the basic libraries for implementing common patterns (authentication, caching, sessions,
ORM, etc). They are both opinioned about The Way to Do A Thing.

In the vein of "pick a boring technology" either Rails or Django would provide the least number of subsequent technology decisions
and resulting maintenance burden. DOL OCIO already approves of Python, which makes Django the better choice.
