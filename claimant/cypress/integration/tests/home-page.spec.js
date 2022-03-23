/* eslint-disable no-undef */

context("Home page", { scrollBehavior: "center" }, () => {
  it("Can log out", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.contains("Log out").click();
    cy.contains("Web address incomplete");
    cy.pa11y({
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });
});
