/* eslint-disable no-undef */

context("Prequalifications page", { scrollBehavior: "center" }, () => {
  it("redirects to IdP on happy path answers", () => {
    cy.visit("/prequal/");
    completePrequalFormProceed();
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/idp/?swa=NJ");
  });

  it("redirects to SWA-specific redirection page on unhappy path answers", () => {
    cy.visit("/prequal/");
    completePrequalFormProceed();
    cy.get("input[id=worked_other_state-yes]").click({ force: true });
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/swa-redirect/NJ/");
    cy.contains("You may be asked to provide some of this information");
  });

  it("redirects to SWA-specific if not worked in last 18 months", () => {
    cy.visit("/prequal/");
    completePrequalFormProceed();
    cy.get("input[id=job_last_18mo-no]").click({ force: true });
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/swa-redirect/NJ/");
  });
});

const completePrequalFormProceed = () => {
  cy.get("input[id=live_in_us-yes]").click({ force: true });
  cy.get("select[name=swa_code]").select("NJ", { force: true }); // for some reason id is not found
  cy.get("input[id=job_last_18mo-yes]").click({ force: true });
  cy.get("input[id=worked_other_state-no]").click({ force: true });
  cy.get("input[id=disabled-no]").click({ force: true });
  cy.get("input[id=recent_disaster-no]").click({ force: true });
  cy.get("input[id=military_service-no]").click({ force: true });
  cy.get("input[id=federal_employment-no]").click({ force: true });
  cy.get("input[id=maritime_employment-no]").click({ force: true });
};
