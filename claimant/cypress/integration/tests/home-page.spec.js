/* eslint-disable no-undef */

context("Home page", { scrollBehavior: "center" }, () => {
  it("Can log out", () => {
    cy.login();
    cy.visit("/claimant/");
    cy.contains("Log out").click();
    cy.url().should("contain", "/about/");
  });
});
