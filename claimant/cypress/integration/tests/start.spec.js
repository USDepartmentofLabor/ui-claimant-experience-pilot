/* eslint-disable no-undef */

context("Let's get started page", { scrollBehavior: "center" }, () => {
  beforeEach(() => {
    cy.visit("/start/");
  });

  it("redirects to IdP on happy path answers", () => {
    cy.check_a11y();
    completePrequalFormProceed();
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/idp/?swa=NJ");
  });

  it("redirects to SWA-specific redirection page on unhappy path answers", () => {
    completePrequalFormProceed();
    cy.click_yes("worked_other_state");
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/swa-redirect/NJ/");
    cy.contains("Once you’ve created your account");
  });

  it("redirects to SWA-specific if not worked in last 18 months", () => {
    completePrequalFormProceed();
    cy.click_no("job_last_18mo");
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/swa-redirect/NJ/");
  });

  it("shows/hides error message(s) on form validation", () => {
    cy.click_next();
    cy.contains("Correct the 10 errors");
    cy.contains("This field is required");
    cy.get("span.usa-error-message").should("have.length", 10);
    cy.get(".usa-alert--error").should("have.length", 1);
    cy.check_a11y();

    // click one answer, confirm error count changes
    cy.click_yes("live_in_us");
    cy.get("span.usa-error-message").should("have.length", 9);
    cy.get(".usa-alert--error").should("have.length", 1);
    cy.contains("Correct the 9 errors");

    completePrequalFormProceed();
    cy.get("span").not(".usa-error-message");
    cy.get("div").not(".usa-alert--error");
  });

  it("redirects to IdP if prequal has already been completed", () => {
    completePrequalFormProceed();
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/idp/?swa=NJ");
    // Redirect part
    cy.visit("/start/");
    cy.url().should("contain", "/idp/");
  });
});

const selectState = (state) => {
  cy.get("select[name=swa_code]").select(state, { force: true }); // id attribute is removed by uswds.js
};

const completePrequalFormProceed = () => {
  cy.click_no("filed_last_12mo");
  cy.click_yes("live_in_us");
  selectState("NJ");
  cy.click_yes("job_last_18mo");
  cy.click_no("worked_other_state");
  cy.click_no("disabled");
  cy.click_no("recent_disaster");
  cy.click_no("military_service");
  cy.click_no("federal_employment");
  cy.click_no("maritime_employment");
};
