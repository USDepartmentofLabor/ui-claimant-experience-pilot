# Forms Management

- Status: Decided
- Deciders: Team concensus
- Date: 2021-11-09

The claimant app will make use of many form fields for data entry. The application should have a consistent way to define fields, validate input, and store the data in the app.

## Assumptions

We will make use of the form components from the react-uswds package, which follow the USWDS guidelines. This ADR addresses the programming components and libraries required to support those guidelines.

## Constraints

The selected technology should integrate well with the React framework we are using for the frontend.

The claimant pilot backend and SWAs will use JSON Schema descriptions to validate the data they exchange. If the frontend form can also use the same JSON Schema, there would be less duplication and reduced chance of a mismatch between the two.

## Considered Alternatives

- [Formik](https://formik.org/)
- [JSON Forms](https://jsonforms.io/)
- [react-hook-form](https://react-hook-form.com/)

## Pros and Cons of the Alternatives

### Formik

- `+` Moderately small (13KB) library
- `+` Includes some validation support in the library
- `+` Preferred by the react-uswds team
- `±` Provides and manages its own data store
- `-` May conflict with our existing React data store
- `-` Requires a special `Field` wrapper component
- `-` More custom code per field than with JSON schema validation
- `-` Requires validation via a separate `yup` package

### JSON Forms

- `+` Builds form presentation and validation off the JSON schema
- `+` Supports i18n via external functions such as react-i18next
- `+` Very simple to define and manage new fields
- `+` Includes validation via the JSON schema
- `-` Extremely large JS load (~1MB) library (mobile-hostile)
- `-` Runs slowly on large JSON schemas; hard to define "large"

### react-hook-form

- `+` Very small (~6KB) and performant library
- `+` Straightforward to integrate with Typescript
- `+` Does not integrate as easily with "wrapped" inputs (react-uswds)
- `-` More custom code per field than with JSON schema validation
- `-` Requires validation via a separate `yup` package

## Decision Outcome

Use Formik for form definitions and Yup for validation. See #202 for proof of concept.

## Supporting research:

- https://blog.logrocket.com/react-hook-form-vs-formik-comparison/
- https://formik.org/docs/guides/typescript
- https://react-hook-form.com/ts/
- https://dev.to/codedivoire/how-to-internationalize-a-yup-validation-schema-in-a-react-formik-and-react-i18next-app-cj7
