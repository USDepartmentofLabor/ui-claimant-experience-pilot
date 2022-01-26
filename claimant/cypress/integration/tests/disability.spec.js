import faker from "faker";

/* eslint-disable no-undef */

context("Diability section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates Disability", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/disability-status/");

    const disabilityStatus = {
      has_collected_disability: "yes",
      disabled_immediately_before: "no",
      type_of_disability: "State Plan",
      date_disability_began: "01/01/2020",
      recovery_date: "05/02/2020",
      contacted_last_employer_after_recovery: "yes",
    };
    cy.complete_disability_status_information(disabilityStatus);
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");
  });
});
