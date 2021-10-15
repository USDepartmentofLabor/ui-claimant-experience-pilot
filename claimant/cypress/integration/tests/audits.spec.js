// Run the pa11y and Lighthouse audits
/* eslint-disable no-undef */
context("Cypress Audit", { scrollBehavior: false }, () => {
  it("passes pa11y checks", () => {
    // mock the authn flow for 508 checks
    cy.mock_login();

    cy.visit("/claimant/");
    cy.url().should("not.include", "/idp/?redirect_to");

    // run the 508 checks
    cy.pa11y("/claimant/", {
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });

  it("passes lighthouse checks", () => {
    // mock the authn flow
    cy.mock_login();

    cy.visit("/claimant/");
    cy.url().should("not.include", "/idp/?redirect_to");

    // performance tests
    cy.lighthouse();
  });
});
