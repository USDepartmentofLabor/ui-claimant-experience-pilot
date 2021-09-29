# Login.gov Sandbox

Per the [0005 ADR](adr/0005-initial-identity-provider.md) we are using the login.gov sandbox (non-production) environment
for our initial Identity Provider (IdP) implementation. This document describes what developers of the application need
to know about the login.gov sandbox.

## Logging in

You will need an account at the [login.gov sandbox](https://idp.int.identitysandbox.gov/). You can use any legitimate
email address to create an account. One tip: you may eventually want multiple accounts in order to facilitate testing of
various IAL2 error scenarios. If your email host supports the [subaddressing feature](https://simplelogin.io/blog/email-alias-vs-plus-sign)
then you can use that to indicate the identity conditions with which you set up your account.

## Identity Proofing

To fully login to our application, you will need to identity proof to reach IAL2. The IAL2 login.gov support allows for testing
various scenarios based on [special reserved values for name, phone number, etc](https://developers.login.gov/testing/#testing-ial2).
You can also create a [YAML file](https://developers.login.gov/testing/#data-testing) locally to upload and speed up your proofing experience.

## Local development

The `core/.env-example` has all the relevant environment variables, prefixed with `LOGIN_DOT_GOV_`.

You will need a `certs/logindotgov-private.pem` file, which you can obtain from an existing team member.

## Administration

Being a part of the administration team is *not required* to use the login.gov sandbox when acting as a claimant with the application.
You only need to pay attention to this section if you are tasked with rotating a certificate set or creating/modifying the application
configuration.

Managing our [application registration](https://dashboard.int.identitysandbox.gov/) requires a .gov email address.
Once you have created your account, contact an existing team member to get yourself added to the `dol-ui-claimant-sandbox` team.

### Managing a login.gov application

Each installation requires a separate login.gov registration. So local development, and each WCMS environment,
have separate registrations, certificates, and configuration values.

We use the naming convention: `urn:gov:gsa:openidconnect.profiles:sp:sso:dol:ui-arpa-claimant-`*envname* for the `Issuer`
value in each application.

The "redirect_uri" address should be the HTTPS hostname of the environment, ending with `/logindotgov/result`.

Example from our local development configuration:

Field | Value
----- | -----
Friendly Name  | dol-ui-claimant-sandbox
Issuer | urn:gov:gsa:openidconnect.profiles:sp:sso:dol:ui-arpa-claimant-sandbox
Redirect URI | https://sandbox.ui.dol.gov:4430/logindotgov/result
Identity Protocol | openid_connect_private_key_jwt
Attribute Bundle | check all the boxes

Every application has a x509 public/private certificate set. You can generate certificates with:

```sh
(.venv) % make x509-certs
```

By default the certificates expire in one year. To rotate a certificate or register one for the first time,
upload the public certificate to the login.gov dashboard, and the share the private key (`.pem` file) via 1Password and/or
a secure out-of-band channel like https://securetransfer.dol.gov/ encrypted email. The private `.pem` file must
be configured with WCMS secrets as `LOGIN_DOT_GOV_PRIVATE_KEY_FILE`.

To update an application certificate:

1. In your local terminal, in the application directory, type `make x509-certs` and enter the URL of the UI application (e.g. `stage1-ui.dol.gov`) and the IdP name `identitysandbox.gov`
1. Login to the dashboard: https://dashboard.int.identitysandbox.gov/
1. Click on the Apps menu
1. Click on the application Friendly Name
1. Scroll to the bottom and click Edit
1. Select and upload the `certs/identitysandbox.gov-public.crt` file you just created in step 1
1. Copy the contents of `certs/identitysandbox.gov-private.pem` to wherever you store secrets for the team. Be sure to give it a name to correlate with the Friendly Name of this particular application,
since there are multiple private certificates to manage.
1. Click the Update button at the bottom of the page

If you need to verify the contents of a public certificate, the relevant command is:

```sh
openssl x509 -in certs/identitysandbox.gov-public.crt -noout -text
```

If you need the fingerprint of a public certificate:

```sh
openssl x509 -sha256 -in certs/identitysandbox.gov-public.crt -noout -fingerprint
```

## OIDC

The OpenID Connect protocol is the exchange standard we use for IdP handshaking. The [Python library](https://github.com/trussworks/logindotgov-oidc-py)
uses the `LOGIN_DOT_GOV_ENV` environment variable to [trigger which service to interrogate](https://github.com/trussworks/logindotgov-oidc-py/blob/main/logindotgov/oidc.py#L64)
for its well known configuration. All our WCMS environments and local environment should use the `sandbox` value. The CI environment
uses `test` in order to trigger the [mock server](https://github.com/trussworks/logindotgov-oidc-py/blob/main/logindotgov/mock_server.py).
