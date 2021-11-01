// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import "cypress-audit/commands";

/* eslint-disable no-undef */

// test login uses local form page
Cypress.Commands.add("login", () => {
  if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
    cy.post_login();
  } else {
    cy.real_login();
  }
});

Cypress.Commands.add("real_login", () => {
  cy.visit("https://sandbox.ui.dol.gov:4430/login/?swa=XX");
  // cy.log("on /login/ page");
  cy.get("#email").should("be.visible").type("someone@example.com");
  // cy.log("found email input");
  cy.get("[data-testid='loginbutton']").should("be.visible").click();
  // cy.log("clicked submit");
});

Cypress.Commands.add("post_login", () => {
  cy.request("POST", "/api/login/", {
    email: "someone@example.com",
    swa_code: "XX",
  });
});

Cypress.Commands.add("mock_login", () => {
  cy.intercept("GET", "/api/whoami/", (req) => {
    req.reply({
      form_id: "abc123",
      email: "someone@example.com",
      first_name: "Some",
      last_name: "One",
      swa_code: "XX",
      claimant_id: "the-claimant-id",
    });
  }).as("api-whoami");
});

Cypress.Commands.overwrite("log", (subject, message) =>
  cy.task("log", message)
);
