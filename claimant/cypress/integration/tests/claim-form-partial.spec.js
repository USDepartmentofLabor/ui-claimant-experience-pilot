import faker from "@faker-js/faker";
/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: "center" }, () => {
  it("requires login", () => {
    // Assume prequal is complete
    cy.setCookie("prequal_complete", "true");
    if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
      // always pass since we cannot redirect to a different port (4430)
    } else {
      cy.visit("/claimant/");
      cy.url().should("include", "/idp/?redirect_to=");
    }
  });

  it("saves partial claim", () => {
    cy.login(faker.internet.exampleEmail());
    cy.navigate_to_form();
    cy.complete_claimant_names({ first_name: "Dave", last_name: "Smith" });
    cy.complete_claimant_addresses({
      residence_address: {
        address1: "1 Street",
        address2: "Apartment 12345",
        city: "City",
        state: "CA",
        zipcode: "00000",
      },
      mailing_address: {
        address1: faker.address.streetAddress(),
        address2: "Apt 5",
        city: faker.address.city(),
        state: faker.address.stateAbbr(),
        zipcode: faker.address.zipCode(),
      },
    });
    cy.click_next();
    cy.complete_contact_information();
    cy.click_next();
  });

  it("saves and exits and restores", () => {
    const email = faker.internet.exampleEmail();
    cy.login(email);
    cy.navigate_to_form();
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
    cy.click_next(); // must advance for dev server to find a Back button
    cy.click_save_and_exit();

    cy.login(email);
    cy.visit("/claimant/claim");
    cy.get("[name=claimant_name\\.first_name]").should("have.value", "Dave");
  });

  it("restores partial claim", () => {
    const email = faker.internet.exampleEmail();
    cy.login(email);
    cy.navigate_to_form();
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
    cy.navigate_to_form({ inProgress: true, at: "/claimant/claim/contact" });
    cy.url().should("contain", "/claim/contact");
    cy.click_back();
    cy.get("[name=claimant_name\\.first_name]").should("have.value", "Dave");
    // TODO this will fail on automatic re-tries. We should figure out how to
    // reliably count per attempt, so we can verify our caching logic.
    // cy.verifyCallCount("@GET-whoami", 2);
  });

  it("deletes and starts over", () => {
    const email = faker.internet.exampleEmail();
    cy.login(email);
    cy.navigate_to_form();
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
    cy.contains("Delete application").scrollIntoView().click();
    cy.navigate_to_form();
    cy.get("h1").contains("Personal").should("be.visible");
  });

  describe("Error focusing", () => {
    it("focuses the first error when submitting the form after page load", () => {
      const email = faker.internet.exampleEmail();
      cy.login(email);
      cy.navigate_to_form();

      cy.get("h1").contains("Personal").should("be.visible");

      cy.click_next();

      cy.get("h1").contains("Personal").should("be.visible");

      cy.get(".usa-form-group--error input:first").should("have.focus");
    });

    it("focuses the first error when submitting the form immediately after swapping to a new page", () => {
      const email = faker.internet.exampleEmail();
      cy.login(email);
      cy.navigate_to_form();

      cy.get("h1").contains("Personal").should("be.visible");

      cy.navigate_to_form();
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

      cy.get("h1").contains("Contact").should("be.visible");

      cy.click_next();

      cy.get(".usa-form-group--error input:first").should("have.focus");
    });
  });
});
