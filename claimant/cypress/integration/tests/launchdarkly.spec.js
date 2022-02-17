/* eslint-disable no-undef */
context("LaunchDarkly", { scrollBehavior: false }, () => {
  it("fetches LaunchDarkly flags", () => {
    cy.intercept("GET", "**/sdk/evalx/**", {
      fixture: "ld-config.json",
    }).as("get-flags");

    // mock the authn flow
    cy.mock_login();

    cy.visit("/claimant/");
    cy.wait("@get-flags");
    cy.url().should("not.include", "/idp/?redirect_to");
    cy.contains("testFlagClient").should("not.be.visible");
  });
});
