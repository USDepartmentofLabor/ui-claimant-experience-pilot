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
Cypress.Commands.add("login", (email) => {
  if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
    cy.post_login(email);
  } else {
    cy.real_login(email);
  }
});

Cypress.Commands.add("real_login", (email) => {
  cy.visit("https://sandbox.ui.dol.gov:4430/login/?swa=XX");
  cy.get("#email")
    .should("be.visible")
    .type(email || "someone@example.com");
  cy.get("#ssn").should("be.visible").type("900-00-1234");
  cy.get("#birthdate").should("be.visible").type("2000-01-01");
  cy.get("[data-testid='loginbutton']").should("be.visible").click();
});

Cypress.Commands.add("post_login", (email) => {
  cy.request("POST", "/api/login/", {
    email: email || "someone@example.com",
    ssn: "900-00-1234",
    birthdate: "2000-01-01",
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
      swa_name: "SomeState",
      swa_claimant_url: "https://some-state.fake.url/",
      claimant_id: "the-claimant-id",
      ssn: "900-00-1234",
      birthdate: "2000-01-01",
    });
  }).as("api-whoami");
});

Cypress.Commands.overwrite("log", (subject, message) =>
  cy.task("log", message)
);

Cypress.Commands.add("click_next", () => {
  cy.get("button")
    .contains("Next")
    .scrollIntoView()
    .should("be.visible")
    .click();
});

Cypress.Commands.add("click_final_submit", () => {
  cy.get("[data-testid='button']").contains("Test Claim").click();
});

Cypress.Commands.add("click_is_complete", () => {
  cy.get("[name=is_complete]").check({ force: true });
});

Cypress.Commands.add("complete_claimant_names", (claimant) => {
  cy.get("[name=claimant_name\\.first_name]").type(claimant.first_name);
  cy.get("[name=claimant_name\\.last_name]").type(claimant.last_name);
  if (claimant.alternate_names) {
    cy.get("input[id=claimant_has_alternate_names\\.yes").parent().click();
    // TODO handle alternate_names
  } else {
    cy.get("input[id=claimant_has_alternate_names\\.no").parent().click();
  }
});

Cypress.Commands.add("complete_claimant_addresses", (addresses) => {
  cy.get("[name=residence_address\\.address1]").type(
    addresses.residence_address.address1
  );
  cy.get("[name=residence_address\\.address2]").type(
    addresses.residence_address.address2
  );
  cy.get("[name=residence_address\\.city]").type(
    addresses.residence_address.city
  );
  cy.get("[name=residence_address\\.state]").select(
    addresses.residence_address.state
  );
  cy.get("[name=residence_address\\.zipcode]").type(
    addresses.residence_address.zipcode,
    { force: true }
  );
  if (!addresses.mailing_address) {
    cy.get("[name=LOCAL_mailing_address_same]").check({ force: true });
  } else {
    // TODO
  }
});
