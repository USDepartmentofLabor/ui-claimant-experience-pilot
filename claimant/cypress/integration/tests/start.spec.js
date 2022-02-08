/* eslint-disable no-undef */

context("SWA start page", { scrollBehavior: "center" }, () => {
  it("redirects to /prequal on happy path answers", () => {
    cy.visit("/start/XX/");
    cy.click_yes("use-app");
    cy.click_next();
    cy.url().should("contain", "/prequal/");
    cy.url().should("contain", "swa=XX");
  });

  it("requires radio selection to proceed", () => {
    cy.visit("/start/XX/");
    cy.click_next();
    cy.contains("Correct the error on this page");
    cy.url().should("contain", "/start/XX/");
  });

  it("shows 404 when SWA code is not active", () => {
    cy.request({ url: "/start/oops/", failOnStatusCode: false })
      .its("status")
      .should("equal", 404);
  });

  it("redirects to SWA site redirection page on unhappy path answers", () => {
    cy.visit("/start/XX/");
    cy.click_no("use-app");
    // cypress cannot access other domains so do not click Next, just check that form.action has changed
    cy.get("#use-app-form")
      .invoke("attr", "action")
      .should("eq", "https://xx.example.gov/");
  });

  it("shows/hides error message(s) on form validation", () => {
    cy.visit("/start/XX/");
    cy.click_next();
    cy.contains("Correct the error on this page");
    cy.contains("This field is required");
    cy.get("span").filter(".usa-error-message");
    cy.get("div").filter(".usa-alert--error");
    cy.click_yes("use-app");
    cy.get("span").not(".usa-error-message");
    cy.get("div").not(".usa-alert--error");
  });
});
