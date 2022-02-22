// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "./commands";

import "@cypress/code-coverage/support";

// Alternatively you can use CommonJS syntax:
// require('./commands')

/* eslint-disable no-undef */

beforeEach(() => {
  // observability only. useful for counting requests to verify caching.
  cy.intercept(
    "GET",
    "/api/partial-claim/",
    cy.spy().as("GET-partial-claim")
  ).as("GET-partial-claim");
  cy.intercept(
    "POST",
    "/api/partial-claim/",
    cy.spy().as("POST-partial-claim")
  ).as("POST-partial-claim");
  cy.intercept(
    "GET",
    "/api/completed-claim/",
    cy.spy().as("GET-completed-claim")
  ).as("GET-completed-claim");
  cy.intercept(
    "POST",
    "/api/completed-claim/",
    cy.spy().as("POST-completed-claim")
  ).as("POST-completed-claim");
  cy.intercept("GET", "/api/whoami/", cy.spy().as("GET-whoami")).as(
    "GET-whoami"
  );
});
