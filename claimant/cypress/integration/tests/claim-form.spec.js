import faker from "faker";
/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: false }, () => {
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
    // clear first to replace the whoami.email value
    cy.get("[name=email]").clear().type("dave@example.com");
    cy.click_next();
    cy.click_final_submit();
    cy.contains("Progress saved").should("be.visible");
  });

  it("saves completed claim", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/");
    cy.complete_claimant_names({ first_name: "Dave", last_name: "Smith" });
    cy.get("[name=email]").clear().type("dave@example.com");
    cy.click_next();
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
});
