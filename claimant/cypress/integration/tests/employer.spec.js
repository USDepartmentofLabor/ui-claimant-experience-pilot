import faker from "@faker-js/faker";

/* eslint-disable no-undef */

const createEmployer0 = () => {
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
    state_employer_payroll_number: "123-456",
    self_employed: false,
    separation: {
      reason: "laid_off",
      option: "position_eliminated",
      comment: "they ran out of money",
    },
  };
  cy.complete_employer_form(employer0);
};

const createEmployer1 = () => {
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
    self_employed: true,
    separation: {
      reason: "still_employed",
      option: "hours_reduced_by_employer",
      comment: "reduced hours",
    },
  };
  cy.complete_employer_form(employer1, "1");
};

context("Employer section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates employers", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/employer/");
    createEmployer0();
    cy.click_more_employers("yes", "0");
    cy.click_next();
    createEmployer1();
    cy.click_more_employers("no", "1");
    cy.click_next();
  });
});

context(
  "Employer Review section of the Claim form",
  { scrollBehavior: "center" },
  () => {
    it("shows all Employer profiles", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/employer/");
      createEmployer0();
      cy.click_more_employers("yes", "0");
      cy.click_next();
      createEmployer1();
      cy.click_more_employers("no", "1");
      cy.click_next();
      cy.contains("Your recent work history").should("be.visible");
      cy.contains("ACME 0").should("be.visible");
      cy.contains("ACME 1").should("be.visible");
      cy.click_next();
    });

    it("shows errors with links", () => {
      const email = faker.internet.exampleEmail();
      cy.login(email);
      cy.visit("/claimant/claim/employer/");
      createEmployer0();
      cy.click_more_employers("yes", "0");
      cy.click_next();
      createEmployer1();
      cy.click_more_employers("yes", "1");
      cy.click_next();
      cy.get(`[name=employers\\[2\\]\\.name`)
        .should("be.visible")
        .type("ACME 2");
      cy.click_save_and_exit();

      cy.login(email);
      cy.visit("/claimant/claim/employer-review/");
      cy.contains("Your recent work history").should("be.visible");
      cy.contains("ACME 0").should("be.visible");
      cy.contains("ACME 1").should("be.visible");
      cy.contains("ACME 2").should("be.visible");
      cy.get("a").contains("Fix 12 errors").should("be.visible").click();
      cy.url().should("contain", "/claimant/claim/employer/2");
    });

    it("cleans up empty employer records", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/employer/");
      createEmployer0();
      cy.click_more_employers("yes", "0");
      cy.click_next();
      cy.visit("/claimant/claim/employer-review/");
      cy.contains("Your recent work history").should("be.visible");
      cy.contains("ACME 0").should("be.visible");
      cy.contains("errors").should("not.exist");
    });

    it("show links to add a new Employer", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/employer/");
      createEmployer0();
      cy.click_more_employers("no", "0");
      cy.click_next();
      cy.contains("Your recent work history").should("be.visible");
      cy.contains("ACME 0").should("be.visible");
      cy.get("a").contains("Add another employer (optional)").click();
      cy.url().should("contain", "/claimant/claim/employer/1");
    });

    it("navigates to previous employer entry", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/employer/");
      createEmployer0();
      cy.click_more_employers("yes", "0");
      cy.click_next();
      createEmployer1();
      cy.click_more_employers("no", "1");
      cy.click_next();
      cy.contains("ACME 0").should("be.visible");
      cy.contains("ACME 1").should("be.visible");
      cy.click_back();
      cy.url().should("contain", "/claimant/claim/employer/1");
    });
  }
);
