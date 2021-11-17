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

  it("sends test email", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.get("[name=first_name]").type("Dave");
    cy.get("[name=email]").type("dave@example.com");
    cy.get("[data-testid='button']").contains("Test Claim").click();
    cy.contains("Claim submitted").should("be.visible");
  });
});
