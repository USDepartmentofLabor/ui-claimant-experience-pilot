/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: false }, () => {
  it("requires login", () => {
    if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
      // always pass since we cannot redirect to a different port (4430)
    } else {
      cy.visit("/claimant/");
      cy.url().should("include", "/idp/?redirect_to=");
    }
  });

  it("saves partial claim", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]").type("Dave");
    cy.get("[name=claimant_name\\.last_name]").type("Smith");
    // clear first to replace the whoami.email value
    cy.get("[name=email]").clear().type("dave@example.com");
    cy.get("button").contains("Next").click();
    cy.get("[data-testid='button']").contains("Test Claim").click();
    cy.contains("Progress saved").should("be.visible");
  });

  it("saves completed claim", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]").type("Dave");
    cy.get("[name=claimant_name\\.last_name]").type("Smith");
    cy.get("[name=email]").clear().type("dave@example.com");
    cy.get("button").contains("Next").click();
    cy.get("[name=is_complete]").check({ force: true });
    cy.get("[data-testid='button']").contains("Test Claim").click();
    cy.contains("Claim submitted").should("be.visible");
  });

  it("shows error if any required field is missing", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]").clear();
    cy.get("button").contains("Next").click();
    cy.contains("is required").should("be.visible");
  });
});
