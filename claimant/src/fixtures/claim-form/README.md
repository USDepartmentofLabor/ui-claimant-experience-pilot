# Claim Form Fixtures

These fixtures are used in testing between the front end and back end to ensure that validation in both codebases is aligned.

## Organization

These fixtures should be organized as follows:

```
/{page-name}
  /valid
    {name-of-valid-scenario}.json
    {name-of-other-valid-scenario}.json
  /invalid
    {name-of-invalid-scenario}.json
    {name-of-other-invalid-scenario}.json
```

## Quirks

Since inputs like radio buttons and checkboxes start `undefined`, it is possible that a value will not be sent to the back end in these cases.
JSON, however, does not have a way to represent `undefined` values other than to not include them.
Since the back end tests overwrite a base-claim with the contents of a fixture, top level fields that are not included (i.e `undefined`) would not override their corresponding field in the base claim.
Therefore, we mark the `undefined` fields as `null` in our fixtures, and strip them out programmatically for our tests.
So long as fields continue to be initialized as `undefined` (or empty string in the case of text inputs) and not `null`, this pattern will work.
