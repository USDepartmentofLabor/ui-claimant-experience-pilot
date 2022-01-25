/* eslint-disable no-undef */

context("SWA start page", { scrollBehavior: "center" }, () => {
  it("redirects to /prequal on happy path answers", () => {
    cy.visit("/start/XX/");
    cy.get("input[id=use-app-yes]").click({ force: true });
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/prequal/");
    cy.url().should("contain", "swa=XX");
  });

  it("requires radio selection to proceed", () => {
    cy.visit("/start/XX/");
    cy.get("button").contains("Next").click();
    cy.contains("Please make a selection");
    cy.url().should("contain", "/start/XX/");
  });

  it("shows 404 when SWA code is not active", () => {
    cy.request({ url: "/start/oops/", failOnStatusCode: false })
      .its("status")
      .should("equal", 404);
  });

  it("redirects to SWA site redirection page on unhappy path answers", () => {
    cy.visit("/start/XX/");
    cy.get("input[id=use-app-no]").click({ force: true });
    // cypress cannot access other domains so do not click Next, just check that form.action has changed
    cy.get("#use-app-form")
      .invoke("attr", "action")
      .should("eq", "https://xx.example.gov/");
  });
});
