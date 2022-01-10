import faker from "faker";
/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: "center" }, () => {
  it("requires login", () => {
    if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
      // always pass since we cannot redirect to a different port (4430)
    } else {
      cy.visit("/claimant/");
      cy.url().should("include", "/idp/?redirect_to=");
    }
  });

  it("saves partial claim", () => {
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
    cy.contains("Progress saved").should("be.visible");
  });

  it("restores partial claim", () => {
    const email = faker.internet.exampleEmail();
    cy.login(email);
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
    cy.logout();

    cy.login(email);
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]").should("have.value", "Dave");
  });

  it("saves completed claim", () => {
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
    cy.click_more_employers("no");
    cy.click_next();

    /// Self-employment page
    const selfEmployment = {
      is_self_employed: "yes",
      ownership_in_business: "yes",
      is_corporate_officer: "yes",
      related_to_owner: "yes",
      name_of_business: "Joe's Cafe",
      name_of_corporation: "ACME Corp",
      corporation_or_partnership: "no",
    };
    cy.complete_self_employment_information(selfEmployment);
    cy.click_next();

    // Occupation page
    cy.complete_occupation_form({
      title: "registered nurse",
      description: "I am a nurse",
      bls_code: "29-1141",
    });
    cy.click_next();

    // TODO all the other pages go here as we write them

    // final page
    cy.click_is_complete();
    cy.click_final_submit();
    cy.contains("Claim submitted").should("be.visible");
    // Should no longer allow the claim form to be accessed
    cy.visit("/claimant/");
    cy.contains("Sorry, you have a Claim currently being processed").should(
      "be.visible"
    );
  });

  it("shows error if any required field is missing", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]").clear();
    cy.click_next();
    cy.contains("is required").should("be.visible");
  });

  it("shows error if any field exceeds max length", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/");
    cy.get("[name=claimant_name\\.first_name]")
      .clear()
      .type("1234567890".repeat(4))
      .blur();
    cy.contains("cannot exceed a maximum of 36 characters").should(
      "be.visible"
    );
  });
});
