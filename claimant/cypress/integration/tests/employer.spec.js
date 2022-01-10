import faker from "faker";

/* eslint-disable no-undef */

context("Employer section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates employers", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/");
    cy.complete_claimant_names({ first_name: "Dave", last_name: "Smith" });
    cy.complete_claimant_addresses({
      residence_address: {
        address1: "1 Street",
        address2: "Apartment 12345",
        city: "City",
        state: "CA",
        zipcode: "00000",
      },
    });
    cy.click_next();

    cy.complete_demographic_information();
    cy.click_next();

    const employer0 = {
      name: "ACME 0",
      first_work_date: "01/01/2020",
      address: {
        address1: "123 Main St",
        address2: "Suite 456",
        city: "Somewhere",
        state: "KS",
        zipcode: "12345",
      },
      phones: [{ number: "555-555-5555" }],
    };
    cy.complete_employer_form(employer0);
    cy.click_more_employers("yes", "0");
    cy.click_next();

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
    };
    cy.complete_employer_form(employer1, "1");
    cy.click_more_employers("no", "1");
    cy.click_next();

    cy.contains("Progress saved").should("be.visible");
  });
});
