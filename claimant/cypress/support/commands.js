// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

import "cypress-audit/commands";

/* eslint-disable no-undef */

// test login uses local form page
Cypress.Commands.add("login", (email) => {
  if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
    cy.post_login(email);
  } else {
    cy.real_login(email);
  }
});

Cypress.Commands.add("logout", () => {
  if (Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000") {
    cy.clearCookies();
  } else {
    cy.contains("Log out").click();
  }
});

Cypress.Commands.add("real_login", (email) => {
  cy.visit("https://sandbox.ui.dol.gov:4430/login/?swa=XX");
  cy.get("#email")
    .should("be.visible")
    .type(email || "someone@example.com");
  cy.get("#ssn").should("be.visible").type("900-00-1234");
  cy.get("#birthdate").should("be.visible").type("2000-01-01");
  cy.get("[data-testid='loginbutton']").should("be.visible").click();
});

Cypress.Commands.add("post_login", (email) => {
  cy.request("POST", "/api/login/", {
    email: email || "someone@example.com",
    ssn: "900-00-1234",
    birthdate: "2000-01-01",
    IAL: "2",
    swa_code: "XX",
  });
});

Cypress.Commands.add("mock_login", () => {
  cy.intercept("GET", "/api/whoami/", (req) => {
    req.reply({
      form_id: "abc123",
      email: "someone@example.com",
      first_name: "Some",
      last_name: "One",
      swa_code: "XX",
      swa_name: "SomeState",
      swa_claimant_url: "https://some-state.fake.url/",
      claimant_id: "the-claimant-id",
      ssn: "900-00-1234",
      IAL: "2",
      birthdate: "2000-01-01",
    });
  }).as("api-whoami");
  cy.intercept("GET", "/api/partial-claim/", (req) => {
    req.reply({ statusCode: 404, body: { status: "error" } });
  }).as("api-partial-claim");
  cy.intercept("GET", "/api/completed-claim/", (req) => {
    req.reply({ statusCode: 404, body: { status: "error" } });
  }).as("api-completed-claim");
});

Cypress.Commands.add("mock_partial_success", () => {
  cy.intercept("POST", "/api/partial-claim/", (req) => {
    req.reply({ statusCode: 202, body: { status: "ok" } });
  }).as("POST-api-partial-claim");
});

Cypress.Commands.overwrite("log", (subject, message) =>
  cy.task("log", message)
);

Cypress.Commands.add("check_a11y", () => {
  cy.pa11y({
    runners: ["htmlcs"],
    standard: "WCAG2AA",
  });
});

Cypress.Commands.add("click_next", () => {
  cy.get("button")
    .contains("Next")
    .scrollIntoView()
    .should("be.visible")
    .click();
});

Cypress.Commands.add("complete_employer_form", (employer, idx = "0") => {
  cy.get(`[name=employers\\[${idx}\\]\\.name`)
    .should("be.visible")
    .type(employer.name);
  if (employer.last_work_date) {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_still_working\\.no`)
      .parent()
      .should("be.visible")
      .click();
    cy.get(`input[id=employers\\[${idx}\\]\\.last_work_date`)
      .should("be.visible")
      .type(employer.last_work_date);
  } else {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_still_working\\.yes`)
      .parent()
      .should("be.visible")
      .click();
  }
  cy.get(`input[id=employers\\[${idx}\\]\\.first_work_date`)
    .should("be.visible")
    .clear()
    .type(employer.first_work_date);
  cy.get(`[name=employers\\[${idx}\\]\\.address\\.address1`)
    .should("be.visible")
    .type(employer.address.address1);
  cy.get(`[name=employers\\[${idx}\\]\\.address\\.address2`)
    .should("be.visible")
    .type(employer.address.address2);
  cy.get(`[name=employers\\[${idx}\\]\\.address\\.city`)
    .should("be.visible")
    .type(employer.address.city);
  cy.get(`[name=employers\\[${idx}\\]\\.address\\.state`)
    .should("be.visible")
    .select(employer.address.state);
  cy.get(`[name=employers\\[${idx}\\]\\.address\\.zipcode`)
    .should("be.visible")
    .type(employer.address.zipcode);
  if (employer.work_site_address) {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_same_address\\.no`)
      .parent()
      .should("be.visible")
      .click();
    // TODO
  } else {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_same_address\\.yes`)
      .parent()
      .should("be.visible")
      .click();
  }
  cy.get(`[name=employers\\[${idx}\\]\\.phones\\[0\\]\\.number`)
    .should("be.visible")
    .type(employer.phones[0].number);
  if (employer.phones.length > 1) {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_same_phone\\.no`)
      .parent()
      .should("be.visible")
      .click();
    cy.get(`[name=employers\\[${idx}\\]\\.phones\\[1\\]\\.number`)
      .should("be.visible")
      .type(employer.phones[1].number);
  } else {
    cy.get(`input[id=employers\\[${idx}\\]\\.LOCAL_same_phone\\.yes`)
      .parent()
      .should("be.visible")
      .click();
  }
  if (employer.fein) {
    cy.get(`[name=employers\\[${idx}\\]\\.fein`)
      .should("be.visible")
      .type(employer.fein);
  }
});

Cypress.Commands.add("click_more_employers", (bool, idx = "0") => {
  cy.get(`input[id=LOCAL_more_employers\\[${idx}\\]\\.${bool}]`)
    .parent()
    .click();
});

Cypress.Commands.add("click_final_submit", () => {
  cy.get("[data-testid='button']").contains("Test Claim").click();
});

Cypress.Commands.add("click_is_complete", () => {
  cy.get("[name=is_complete]").check({ force: true });
});

Cypress.Commands.add("complete_claimant_names", (claimant) => {
  cy.get("[name=claimant_name\\.first_name]").type(claimant.first_name);
  cy.get("[name=claimant_name\\.last_name]").type(claimant.last_name);
  if (claimant.alternate_names) {
    cy.get("input[id=LOCAL_claimant_has_alternate_names\\.yes")
      .parent()
      .click();
    // TODO handle alternate_names
  } else {
    cy.get("input[id=LOCAL_claimant_has_alternate_names\\.no").parent().click();
  }
});

Cypress.Commands.add("complete_claimant_addresses", (addresses) => {
  cy.get("[name=residence_address\\.address1]").type(
    addresses.residence_address.address1
  );
  cy.get("[name=residence_address\\.address2]").type(
    addresses.residence_address.address2
  );
  cy.get("[name=residence_address\\.city]").type(
    addresses.residence_address.city
  );
  cy.get("[name=residence_address\\.state]").select(
    addresses.residence_address.state
  );
  cy.get("[name=residence_address\\.zipcode]").type(
    addresses.residence_address.zipcode,
    { force: true }
  );
  if (!addresses.mailing_address) {
    cy.get("[name=LOCAL_mailing_address_same]").check({ force: true });
  } else {
    // TODO
  }
});

Cypress.Commands.add("complete_occupation_form", (occupation) => {
  cy.get("[name=occupation\\.job_title]").clear().type(occupation.title);
  cy.get(`input[id=occupation\\.bls_code\\.${occupation.bls_code}`)
    .parent()
    .click();
  cy.get("[name=occupation\\.job_description]")
    .clear()
    .type(occupation.description);
});

Cypress.Commands.add("complete_demographic_information", () => {
  cy.get("input[id=sex\\.female]").parent().click();
  cy.get("input[id=ethnicity\\.not_hispanic]").parent().click();
  cy.get("input[id=race\\.asian]").parent().click();
  cy.get("input[id=race\\.hawaiian_or_pacific_islander]").parent().click();
  cy.get("[name=education_level]").select("bachelors");
});

Cypress.Commands.add("complete_union_form", (union) => {
  cy.get(
    `input[id=union\\.is_union_member\\.${
      union.is_union_member ? "yes" : "no"
    }]`
  ).click({ force: true });
  if (union.is_union_member) {
    cy.get("[name=union\\.union_name]")
      .should("be.visible")
      .clear()
      .type(union.union_name);
    cy.get(
      `input[id=union\\.required_to_seek_work_through_hiring_hall\\.${
        union.required_to_seek_work_through_hiring_hall ? "yes" : "no"
      }]`
    ).click({ force: true });
    cy.get("[name=union\\.union_local_number]")
      .clear()
      .type(union.union_local_number);
  }
});

Cypress.Commands.add(
  "complete_self_employment_information",
  (selfEmployment) => {
    [
      "is_self_employed",
      "ownership_in_business",
      "is_corporate_officer",
      "related_to_owner",
      "corporation_or_partnership",
    ].forEach((id) => {
      cy.get(`input[id=self_employment\\.${id}\\.${selfEmployment[id]}]`)
        .parent()
        .click();
    });

    ["name_of_business", "name_of_corporation"].forEach((id) => {
      if (selfEmployment[id]) {
        cy.get(`[name=self_employment\\.${id}]`).type(selfEmployment[id]);
      }
    });
  }
);

Cypress.Commands.add(
  "complete_education_vocational_information",
  (educationVocationalInfo) => {
    [
      "student_fulltime_in_last_18_months",
      "attending_college_or_job_training",
      "registered_with_vocational_rehab",
    ].forEach((id) => {
      cy.get(`input[id=${id}\\.${educationVocationalInfo[id]}]`)
        .parent()
        .click();
    });
  }
);
