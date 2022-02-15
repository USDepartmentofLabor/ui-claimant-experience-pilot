/* eslint-disable no-undef */

context("Home page", { scrollBehavior: "center" }, () => {
  it("Passes pa11y checks", () => {
    cy.visit("/");
    cy.pa11y({
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });
  it("Can log out", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.contains("Log out").click();
    cy.contains("Unemployment Insurance Claim Application");
  });
});
