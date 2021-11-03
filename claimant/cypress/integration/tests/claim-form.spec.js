/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: false }, () => {
  it("sends test email", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.get("[name=firstName]").type("Dave");
    cy.get("[name=email]").type("dave@example.com");
    cy.get("[data-testid='button']").contains("Test Claim").click();
    cy.contains("Claim submitted").should("be.visible");
  });
});
