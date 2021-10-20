/* eslint-disable no-undef */

context("Home page", { scrollBehavior: false }, () => {
  it("Passes pa11y checks", () => {
    cy.visit("/");
    cy.pa11y({
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });
});
