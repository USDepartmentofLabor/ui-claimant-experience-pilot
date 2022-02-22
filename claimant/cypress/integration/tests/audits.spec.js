// Run the pa11y and Lighthouse audits
/* eslint-disable no-undef */

// we toggle some behavior based on running against dev server or docker server
// this is duplicated from cypress/support/commands.js because of the deferred
// load order of the audit modules.
const IS_DEV_SERVER =
  Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000";

context("Cypress Audit", { scrollBehavior: "center" }, () => {
  it("passes pa11y checks", () => {
    // mock the authn flow for 508 checks
    cy.mock_login();

    cy.visit("/claimant/");
    cy.url().should("not.include", "/idp/?redirect_to");

    // run the 508 checks
    cy.check_a11y();
  });

  it("passes lighthouse checks", () => {
    // mock the authn flow
    cy.mock_login();

    cy.visit("/claimant/");
    cy.url().should("not.include", "/idp/?redirect_to");

    // performance tests
    const thresholds = {
      performance: IS_DEV_SERVER ? 30 : 40,
      accessibility: 100,
      "first-contentful-paint": 10000,
      "largest-contentful-paint": IS_DEV_SERVER ? 15000 : 10000,
      "cumulative-layout-shift": 0.1,
      "total-blocking-time": 1000,
    };
    const options = {};
    const config = {
      extends: "lighthouse:default",
      settings: {
        onlyCategories: ["performance", "accessibility"],
        skipAudits: [
          "installable-manifest",
          "splash-screen",
          "themed-omnibox",
          "mainthread-work-breakdown",
          "network-requests",
          "main-thread-tasks",
          "js-libraries",
        ],
      },
    };
    cy.lighthouse(thresholds, options, config);
  });

  it("shows sorry not found on 404", () => {
    cy.login();
    cy.visit("/claimant/oops");
    cy.contains("we could not find that page").should("be.visible");
  });
});
