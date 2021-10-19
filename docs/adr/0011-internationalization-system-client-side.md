# Use react-i18next for client side Internationalization

- Status: In progress
- Deciders: [Names of deciders]
- Date: 10/19/21

In order for unemployment compensation to be accessible to all who qualify, people who speak various languages must
be able to use and understand the UI. States may also have localization specific to their needs.
Although the initial MVP for DOL-ARPA UI Pilot will likely only be in English, it
makes sense to integrate a system for internationalization during this MVP stage and to apply it first with English.
Depending on the states selected, state-based localization may be applied. It
would be more overhead to apply it later, and once the system and patterns are set up it will be low effort
to utilize it.

This ADR addresses options for internationalization for the client-side React application, while taking into consideration the server-side system.

## Considered Alternatives

- [react-i18next](https://react.i18next.com/)
- [react-intl](https://formatjs.io/docs/getting-started/installation/)
- [lingui.js](https://lingui.js.org/index.html)

## Pros and Cons of the Alternatives

### Option 1: react-i18next

- `+` uses React hooks --> quick adoption
- `+` well-maintained, popular library
- `+` potential to utilize [locize](locize.com), a localization management system that bridges translation and development (though adoption by DOL is unknown)
- `+` current engineers have familiarity
- `+` has translation formatting

### Option 2: react-intl (format.js)

- `+` It's popular, so there's lots of documentation
- `+` It's simple
- `+` It includes built-in locale-specific formatting functions
- `-` You cannot use it for non-react components

### Option 3: [lingui.js](https://lingui.js.org/index.html)

- `+` Has react components to use in react rendering
- `-` Specific for Javascript but not for React

## Decision Outcome

## Resources

- [Lost in Translation](https://digital.gov/2012/10/01/automated-translation-good-solution-or-not/) - an article evaluation
  the use of automation in translation
- [The Best Libraries for React i18n](https://phrase.com/blog/posts/react-i18n-best-libraries/)
- [w3.org Internationalization vs. Localization](https://www.w3.org/International/questions/qa-i18n)
- [i18n frameworks- the unfair showdown](https://medium.com/@jamuhl/i18n-frameworks-the-unfair-showdown-8d436cd6f470)

## Considerations

- How does gov do their localization (translation) and how can it integrate with the available libraries?
