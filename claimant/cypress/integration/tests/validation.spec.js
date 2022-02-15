import faker from "@faker-js/faker";
/* eslint-disable no-undef */

function hasNumberOfErrors(num) {
  cy.get(".usa-error-message").should("have.length", num);
}

context("Claim form validation", { scrollBehavior: "center" }, () => {
  it("shows error if any required field is missing", () => {
    cy.login(faker.internet.exampleEmail());
    cy.navigate_to_form();
    cy.get("[name=claimant_name\\.first_name]").clear();
    cy.click_next();
    cy.contains("is required").should("be.visible");
  });

  it("shows error if any field exceeds max length", () => {
    cy.login(faker.internet.exampleEmail());
    cy.navigate_to_form();
    cy.get("[name=claimant_name\\.first_name]")
      .clear()
      .type("1234567890".repeat(4))
      .blur();
    cy.click_next();
    cy.contains("36 characters").should("be.visible");
  });

  it("shows validation messages intuitively", () => {
    // Does not show a validation message on blur
    cy.login(faker.internet.exampleEmail());
    cy.navigate_to_form();
    cy.get("[name=claimant_name\\.first_name]").clear().blur();
    hasNumberOfErrors(0);
    // After submitting the page, all errors should show
    cy.click_next();
    hasNumberOfErrors(6);
    // Also displays the error summary at the top of the page
    cy.contains("Correct the 6 errors on this page to proceed").should(
      "be.visible"
    );
    // Fix all the errors and move on
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
    // All errors should be resolved now
    hasNumberOfErrors(0);
    cy.click_next();

    // Next page should be treated as a fresh/unsubmitted form
    cy.get("[name=phones\\[0\\]\\.number").type("2028675309").blur();
    hasNumberOfErrors(0);
    cy.get("[name=phones\\[0\\]\\.number").clear().blur();
    hasNumberOfErrors(0);

    // New form submission again shows all errors
    cy.click_next();
    hasNumberOfErrors(2);
  });
});
