- Status: In progress
- Deciders: [Names of deciders]
- Date: 10/19/21

In order for unemployment compensation to be accessible to all who qualify, people who speak various languages must be
be able to use and understand the UI. Although the initial MVP for DOL-ARPA UI Pilot will only be in English, it is
makes sense to integrate a system for internationalization during this MVP stage and to apply it first with English. It
would be significantly more overhead to apply it later, and once the system and patterns are set up it will be low effort
to utilize it.

Because the application utilizes server-generated templates for the home page and emails we need a system for internationalization, taking into consideration what system is used on the client-side.

## Considered Alternatives

- [Django Translation](https://docs.djangoproject.com/en/3.2/topics/i18n/translation)
- [i18next](https://github.com/i18next/i18next-fs-backend)

## Option 1: Django Translation

- `+` it's already built in to Django
- `+` can address [template internationalization](https://docs.djangoproject.com/en/3.2/topics/i18n/translation/#internationalization-in-template-code) for our static pages
- `+` provides utilities to extract the translation strings into a message file (.po) which translators can fill in easily
- `-` Developers would need to learn a different internationalization system than for the frontend

## Option 2: i18next-backend

- `+` if using `react-i18next` on the client side, using the i18next tool on the server side would have matching patterns
- `+` backend usage of i18next would need to be in node.js, which we aren't using right now

## Decision Outcome

Django Translation: As a built-in utility, it is simple to implement and does not require adding use of node.js. There
are few static pages (2-3) and likely minimal emails to which to apply the translation on the server side, so the overhead
of using a different system than the frontend is minimal.

## Resources

- [How Does server-side i18n look like](https://dev.to/adrai/how-does-server-side-internationalization-i18n-look-like-5f4c)
