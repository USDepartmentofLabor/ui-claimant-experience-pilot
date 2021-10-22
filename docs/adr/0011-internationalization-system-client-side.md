# Use react-i18next for client side internationalization

- Status: Decided
- Deciders: Team consensus
- Date: 10/19/21

In order for unemployment compensation to be accessible to all who qualify, people who speak various languages must
be able to use and understand the presentation language. Although the initial MVP will only be in English, it
makes sense to integrate a system for internationalization during this MVP stage and to apply it first using English. It
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
- `-` Use of hooks may make it harder to follow for those unfamiliar with them

### Option 2: react-intl (format.js)

- `+` It's popular, so there's lots of documentation
- `+` It's simple
- `+` It includes built-in locale-specific formatting functions
- `-` You cannot use it for non-react components

### Option 3: [lingui.js](https://lingui.js.org/index.html)

- `+` Has react components to use in react rendering
- `-` Specific for Javascript but not for React

## Decision Outcome

**Use react-i18next**: There's not a strong determinant between the two most popular tools, `react-i18next` and `react-intl`. Since `react-i18next` is
increasing in popularity, is well-maintained, and current engineers have had good experiences with it, we will go with that.

## Resources

- [Lost in Translation](https://digital.gov/2012/10/01/automated-translation-good-solution-or-not/) - an article evaluating
  the use of automation in translation
- [The Best Libraries for React i18n](https://phrase.com/blog/posts/react-i18n-best-libraries/)
- [w3.org Internationalization vs. Localization](https://www.w3.org/International/questions/qa-i18n)
- [i18n frameworks- the unfair showdown](https://medium.com/@jamuhl/i18n-frameworks-the-unfair-showdown-8d436cd6f470)

## Considerations

- How do existing DOL websites do their localization (translation) and how can it integrate with the available libraries?
