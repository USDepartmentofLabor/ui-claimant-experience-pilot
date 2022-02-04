import faker from "@faker-js/faker";

/* eslint-disable no-undef */

context("Employer section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates employers", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/employer/");
    const employer0 = {
      name: "ACME 0",
      first_work_date: "01/01/2020",
      last_work_date: "12/01/2020",
      address: {
        address1: "123 Main St",
        address2: "Suite 456",
        city: "Somewhere",
        state: "KS",
        zipcode: "12345",
      },
      phones: [{ number: "555-555-5555" }],
      separation: {
        reason: "laid_off",
        option: "position_eliminated",
        comment: "they ran out of money",
      },
    };
    cy.complete_employer_form(employer0);
    cy.click_more_employers("yes", "0");
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");

    const employer1 = {
      name: "ACME 1",
      first_work_date: "01/01/2021",
      address: {
        address1: "456 Main St",
        address2: "Suite 456",
        city: "Somewhere",
        state: "KS",
        zipcode: "12345",
      },
      phones: [{ number: "555-555-5555" }],
      separation: {
        reason: "still_employed",
        option: "hours_reduced_by_employer",
        comment: "reduced hours",
      },
    };
    cy.complete_employer_form(employer1, "1");
    cy.click_more_employers("no", "1");
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");
  });
});
