// Run the pa11y and Lighthouse audits
/* eslint-disable no-undef */
context("Cypress Audit", { scrollBehavior: false }, () => {
  it("pass pa11y checks", () => {
    // mock the authn flow for 508 checks
    cy.mock_login();

    cy.visit("/claimant/");
    cy.url().should("not.include", "/idp/?redirect_to");

    // run the 508 checks
    cy.pa11y("/claimant/", {
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });

    // performance tests TODO
    // cy.lighthouse();
  });
});
