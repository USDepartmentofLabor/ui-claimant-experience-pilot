// Run the pa11y and Lighthouse audits
/* eslint-disable no-undef */
context("Cypress Audit", { scrollBehavior: false }, () => {
  it("pass pa11y checks", () => {
    // mock the authn flow for 508 checks
    cy.intercept("GET", "/api/whoami", (req) => {
      req.reply({
        form_id: "abc123",
        email: "someone@example.com",
        first_name: "Some",
        last_name: "One",
      });
    }).as("api-whoami");

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
