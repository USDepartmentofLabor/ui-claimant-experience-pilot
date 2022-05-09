/* eslint-disable no-undef */

context("Home page", { scrollBehavior: "center" }, () => {
  it("Can log out", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.logout();
    cy.url().should("equal", Cypress.config("baseUrl") + "/");
    cy.pa11y({
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });
});
