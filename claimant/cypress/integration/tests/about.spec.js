/* eslint-disable no-undef */
context("About page", { scrollBehavior: "center" }, () => {
  it("Passes pa11y checks", () => {
    cy.visit("/about/");
    cy.contains("About");
    cy.pa11y({
      runners: ["htmlcs"],
      standard: "WCAG2AA",
    });
  });
});
