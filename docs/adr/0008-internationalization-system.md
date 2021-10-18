# Use react-i18next for client side Internationalization and ?? for server side

- Status: [In progress or Decided]
- Deciders: [Names of deciders]
- Date: [Date created]

In order for unemployment compensation to be accessible to all who qualify, people who speak various languages must be
be able to use and understand the UI. Although the initial MVP for DOL-ARPA UI Pilot will only be in English, it is
makes sense to integrate a system for internationalization during this MVP stage and to apply it first with English. It
would be significantly more overhead to apply it later, and once the system and patterns are set up it will be low effort
to utilize it.

Because the application utilizes both server-generated localization (templates for the home page and emails) and client-generated
pages in the React app, we need a system for internationalization for both the server and client.

## Considered Alternatives

Client-side:

- [react-i18next](https://react.i18next.com/)
- [react-intl](https://formatjs.io/docs/getting-started/installation/)
- [lingui.js](https://lingui.js.org/index.html)

Server-side:

- [built-in Django translation](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/#internationalization-in-template-code)
- i18next

## Pros and Cons of the Alternatives

## Client-side

### Option 1: react-i18next

- `+` uses React hooks- quick adoption
- `+` potential to utilize [locize](locize.com), a localization management system that bridges translation and development (though adoption by DOL is unknown)
- `+` current engineers have familiarity
- `-` A con of the option

### Option 2: react-intl (format.js)

- `+` It's popular, so there's lots of documentation
- `+` It's simple
- `+` It includes locale-specific formatting functions
- `-` You cannot use it for non-react components

### Option 3: lingui.js

- `+`

## Server-side

### Option 1: Django

- `+` it's already built in to Django
- `+` can address [template internationalization](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/#internationalization-in-template-code) for our static pages
- `+` provides utilities to extract the translation strings into a message file (.po) which translators can fill in easily
- `-`

### Option 2

- `+` if using `react-i18next` on the client side, using the same tool on the server side could be easier to learn for developers
  and more consistent in pattern

## Decision Outcome

Describe what the decision is and some high level information about why it was chosen without rehashing all pros/cons.

## Resources

- [Lost in Translation](https://digital.gov/2012/10/01/automated-translation-good-solution-or-not/) - an article evaluation
  the use of automation in translation
- [The Best Libraries for React i18n](https://phrase.com/blog/posts/react-i18n-best-libraries/) \*[w3.org Internationalization vs. Localization](https://www.w3.org/International/questions/qa-i18n)

## Considerations

- How does gov do their localization (translation) and how can it integrate with the available libraries?
