/* eslint-disable no-undef */

context("Prequalifications page", { scrollBehavior: "center" }, () => {
  it("can submit a qualifying set of answers to proceed", () => {
    // answers to proceed
    cy.visit("/prequal/");
    completePrequalFormProceed();
    cy.get("button").contains("Next").click();
    cy.url().should("contain", "/claimant/");

    // disqualifying answers
    cy.visit("/prequal/");
    completePrequalFormProceed();
    cy.get("input[id=worked_other_state-yes]").click({ force: true });
    cy.get("button").contains("Next").click();
    // TODO: change this url when next page is determined
    cy.url().should("contain", "/claimant/");
  });
});

const completePrequalFormProceed = () => {
  cy.get("input[id=live_in_us-yes]").click({ force: true });
  cy.get("select[id=swa_code]").select("NJ");
  cy.get("input[id=job_last_18mo-yes]").click({ force: true });
  cy.get("input[id=worked_other_state-no]").click({ force: true });
  cy.get("input[id=disabled-no]").click({ force: true });
  cy.get("input[id=military_service-no]").click({ force: true });
  cy.get("input[id=federal_employment-no]").click({ force: true });
  cy.get("input[id=maritime_employment-no]").click({ force: true });
};
