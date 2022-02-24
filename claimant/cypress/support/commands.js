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

export const FAKE_SSN = "900-00-1234";
export const FAKE_BIRTHDATE = "2000-01-01";
export const FAKE_LOGIN = {
  ssn: FAKE_SSN,
  birthdate: FAKE_BIRTHDATE,
  ["address.address1"]: "123 Main St",
  ["address.city"]: "Anywhere",
  ["address.state"]: "KS",
  ["address.zipcode"]: "00000",
  first_name: "Some",
  last_name: "One",
  phone: "555-555-1234",
};

// we toggle some behavior based on running against dev server or docker server
const IS_DEV_SERVER =
  Cypress.config("baseUrl") === "https://sandbox.ui.dol.gov:3000";

// test login uses local form page
Cypress.Commands.add("login", (email, IAL = "2") => {
  if (IS_DEV_SERVER) {
    cy.post_login(email, IAL);
  } else {
    cy.real_login(email, IAL);
  }
});

Cypress.Commands.add("logout", () => {
  if (IS_DEV_SERVER) {
    cy.clearCookies();
  } else {
    cy.contains("Log out").click();
  }
});

Cypress.Commands.add("real_login", (email, IAL = "2") => {
  cy.visit("https://sandbox.ui.dol.gov:4430/login/?swa=XX");
  // toggle the IAL selector first to make fields visible if needed.
  cy.get("#IAL").scrollIntoView().should("be.visible").select(IAL);
  cy.get("#email")
    .should("be.visible")
    .type(email || "someone@example.com");
  if (IAL === "2") {
    Object.keys(FAKE_LOGIN).forEach((field) => {
      if (field === "address.state") {
        cy.get("#address\\.state")
          .scrollIntoView()
          .should("be.visible")
          .select(FAKE_LOGIN[field]);
      } else {
        cy.get(`#${field.replace(/\./, "\\.")}`)
          .scrollIntoView()
          .should("be.visible")
          .clear()
          .type(FAKE_LOGIN[field]);
      }
    });
  }
  cy.get("[data-testid='loginbutton']")
    .scrollIntoView()
    .should("be.visible")
    .click();
});

Cypress.Commands.add("post_login", (email, IAL) => {
  cy.request("POST", "/api/login/", {
    email: email || "someone@example.com",
    IAL,
    swa_code: "XX",
    ...FAKE_LOGIN,
  });
});

Cypress.Commands.add("mock_login", () => {
  cy.intercept("GET", "/api/whoami/", (req) => {
    req.reply({
      email: "someone@example.com",
      swa: {
        code: "XX",
        name: "SomeState",
        claimant_url: "https://some-state.fake.url/",
        featureset: "Claim And Identity",
      },
      claimant_id: "the-claimant-id",
      IAL: "2",
      ...FAKE_LOGIN,
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
  cy.get("button[type='submit']")
    .contains("Next")
    .scrollIntoView()
    .should("be.visible")
    .click();
});

Cypress.Commands.add("click_back", () => {
  cy.get("[data-testid=back-button]")
    .contains("Back")
    .scrollIntoView()
    .should("be.visible")
    .click();
});

Cypress.Commands.add("click_save_and_exit", () => {
  if (IS_DEV_SERVER) {
    cy.click_back();
    cy.clearCookies();
  } else {
    cy.get("button")
      .contains("Save and exit")
      .scrollIntoView()
      .should("be.visible")
      .click();
  }
  cy.wait(1000); // hesitate to let the server do its thing
});

Cypress.Commands.add("complete_identity_information", (identityInformation) => {
  const {
    ssn,
    birthdate,
    idNumber,
    issuingState,
    authorizedToWork,
    notAuthorizedToWorkExplanation,
    authorizationType,
    alienRegistrationNumber,
  } = identityInformation;

  cy.get(`[name=ssn]`).should("be.disabled").should("have.value", ssn);

  const [year, month, day] = birthdate.split("-");

  cy.get(`[name=birthdate\\.month]`)
    .should("be.visible")
    .should("be.disabled")
    .should("have.value", month);
  cy.get(`[name=birthdate\\.day]`)
    .should("be.visible")
    .should("be.disabled")
    .should("have.value", day);
  cy.get(`[name=birthdate\\.year]`)
    .should("be.visible")
    .should("be.disabled")
    .should("have.value", year);

  cy.get(`[name=state_credential\\.drivers_license_or_state_id_number]`)
    .should("be.visible")
    .type(idNumber);

  cy.get(`[name=state_credential\\.issuer]`)
    .should("be.visible")
    .select(issuingState);

  if (authorizedToWork) {
    cy.click_yes("work_authorization\\.authorized_to_work");
  } else {
    cy.click_no("work_authorization\\.authorized_to_work");
  }

  if (notAuthorizedToWorkExplanation) {
    cy.get(`[name=work_authorization\\.not_authorized_to_work_explanation]`)
      .should("be.visible")
      .type(notAuthorizedToWorkExplanation);
  }

  if (authorizationType) {
    cy.get(`[name=work_authorization\\.authorization_type]`)
      .should("be.visible")
      .select(authorizationType);
  }

  if (alienRegistrationNumber) {
    cy.get(`[name=work_authorization\\.alien_registration_number]`)
      .should("be.visible")
      .type(alienRegistrationNumber);
  }
});

Cypress.Commands.add("complete_employer_form", (employer, idx = "0") => {
  cy.get(`[name=employers\\[${idx}\\]\\.name`)
    .should("be.visible")
    .type(employer.name);
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
    cy.get(`[name=employers\\[${idx}\\]\\.fein]`)
      .should("be.visible")
      .type(employer.fein);
  }
  if (employer.separation) {
    cy.get(
      `input[id=employers\\[${idx}\\]\\.separation_reason\\.${employer.separation.reason}]`
    )
      .should("be.visible")
      .parent()
      .click();
    cy.get(
      `input[id=employers\\[${idx}\\]\\.separation_option\\.${employer.separation.option}]`
    )
      .should("be.visible")
      .parent()
      .click();
    cy.get(`[name=employers\\[${idx}\\]\\.separation_comment]`)
      .should("be.visible")
      .clear()
      .type(employer.separation.comment);
  }
  cy.get(`input[id=employers\\[${idx}\\]\\.first_work_date`)
    .should("be.visible")
    .clear()
    .type(employer.first_work_date);
  if (employer.last_work_date) {
    cy.get(`input[id=employers\\[${idx}\\]\\.last_work_date`)
      .should("be.visible")
      .clear()
      .type(employer.last_work_date);
  }
});

Cypress.Commands.add("click_more_employers", (bool, idx = "0") => {
  cy.get(`input[id=LOCAL_more_employers\\[${idx}\\]\\.${bool}]`)
    .parent()
    .click();
});

Cypress.Commands.add("click_final_submit", () => {
  cy.get("[data-testid='next-button']").contains("Test Claim").click();
});

Cypress.Commands.add("click_is_complete", () => {
  cy.get("[name=is_complete]").check({ force: true });
});

Cypress.Commands.add("navigate_to_form", (props) => {
  cy.visit("/claimant/");
  const buttonText = props?.inProgress ? "Continue" : "Start application";
  if (props?.at) {
    cy.contains(buttonText)
      .scrollIntoView()
      .should("have.attr", "href", props.at)
      .click({ force: true });
  } else {
    cy.contains(buttonText).scrollIntoView().click({ force: true });
  }
});

Cypress.Commands.add("complete_claimant_names", (claimant) => {
  cy.get("[name=claimant_name\\.first_name]").clear().type(claimant.first_name);
  cy.get("[name=claimant_name\\.last_name]").clear().type(claimant.last_name);
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
  cy.get("[name=residence_address\\.address1]")
    .clear()
    .type(addresses.residence_address.address1);
  cy.get("[name=residence_address\\.address2]")
    .clear()
    .type(addresses.residence_address.address2);
  cy.get("[name=residence_address\\.city]")
    .clear()
    .type(addresses.residence_address.city);
  cy.get("[name=residence_address\\.state]").select(
    addresses.residence_address.state
  );
  cy.get("[name=residence_address\\.zipcode]")
    .clear()
    .type(addresses.residence_address.zipcode, { force: true });
  if (!addresses.mailing_address) {
    cy.get("[name=LOCAL_mailing_address_same]").check({ force: true });
  } else {
    cy.get("[name=mailing_address\\.address1]")
      .clear()
      .type(addresses.mailing_address.address1);
    cy.get("[name=mailing_address\\.address2]")
      .clear()
      .type(addresses.mailing_address.address2);
    cy.get("[name=mailing_address\\.city]")
      .clear()
      .type(addresses.mailing_address.city);
    cy.get("[name=mailing_address\\.state]").select(
      addresses.mailing_address.state
    );
    cy.get("[name=mailing_address\\.zipcode]")
      .clear()
      .type(addresses.mailing_address.zipcode, { force: true });
  }
});

Cypress.Commands.add("complete_occupation_form", (occupation) => {
  cy.get("[name=occupation\\.job_title]").clear().type(occupation.title);

  if (occupation.page !== undefined) {
    cy.get(
      `button[aria-label="list of occupations page ${occupation.page}"]`
    ).click();
  }

  cy.get(
    `input[id=occupation\\.bls_code\\.${occupation.bls_code.replace(
      /\./,
      "\\."
    )}`
  )
    .parent()
    .click();
  cy.get("[name=occupation\\.job_description]")
    .clear()
    .type(occupation.description);
});

Cypress.Commands.add("complete_contact_information", () => {
  cy.get("[name=phones\\[0\\]\\.number")
    .should("be.visible")
    .clear()
    .type("555-555-1224");
  cy.get("[name=phones\\[0\\]\\.type")
    .select("mobile")
    .should("have.value", "mobile");
  cy.get("input[id=interpreter_required\\.yes]").parent().click();
  cy.get("input[id=preferred_language]").clear().type("Klingon");
});

Cypress.Commands.add("complete_demographic", (demographic) => {
  const { sex, ethnicity, races } = demographic;
  cy.get(`input[id=sex\\.${sex}]`).parent().click();
  cy.get(`input[id=ethnicity\\.${ethnicity}]`).parent().click();

  races.forEach((race) => {
    cy.get(`input[id=race\\.${race}]`).parent().click();
  });
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

    cy.get("[name=education_level]").select(
      educationVocationalInfo.education_level
    );
  }
);

Cypress.Commands.add(
  "complete_disability_status_information",
  (disabilityStatus) => {
    const {
      has_collected_disability,
      disabled_immediately_before,
      type_of_disability,
      date_disability_began,
      recovery_date,
      contacted_last_employer_after_recovery,
    } = disabilityStatus;
    cy.get(
      `input[id=disability\\.has_collected_disability\\.${has_collected_disability}]`
    )
      .parent()
      .click();

    if (disabled_immediately_before) {
      cy.get(
        `input[id=disability\\.disabled_immediately_before\\.${disabled_immediately_before}]`
      )
        .parent()
        .click();
    }

    if (type_of_disability) {
      cy.get("#disability\\.type_of_disability").select(type_of_disability);
    }

    if (date_disability_began) {
      cy.get(`input[id=disability\\.date_disability_began`)
        .should("be.visible")
        .type(date_disability_began);
    }

    if (recovery_date) {
      cy.get(`input[id=disability\\.recovery_date`)
        .should("be.visible")
        .type(recovery_date);
    }

    if (contacted_last_employer_after_recovery) {
      cy.get(
        `input[id=disability\\.contacted_last_employer_after_recovery\\.${contacted_last_employer_after_recovery}]`
      )
        .parent()
        .click();
    }
  }
);

Cypress.Commands.add("complete_availability_information", (availability) => {
  const {
    can_begin_work_immediately,
    cannot_begin_work_immediately_reason,
    can_work_full_time,
    cannot_work_full_time_reason,
    is_prevented_from_accepting_full_time_work,
    is_prevented_from_accepting_full_time_work_reason,
  } = availability;
  cy.get(
    `input[id=availability\\.can_begin_work_immediately\\.${can_begin_work_immediately}]`
  )
    .parent()
    .click();

  if (cannot_begin_work_immediately_reason) {
    cy.get("[name=availability\\.cannot_begin_work_immediately_reason]").type(
      cannot_begin_work_immediately_reason
    );
  }

  cy.get(`input[id=availability\\.can_work_full_time\\.${can_work_full_time}]`)
    .parent()
    .click();

  if (cannot_work_full_time_reason) {
    cy.get("[name=availability\\.cannot_work_full_time_reason]").type(
      cannot_work_full_time_reason
    );
  }

  cy.get(
    `input[id=availability\\.is_prevented_from_accepting_full_time_work\\.${is_prevented_from_accepting_full_time_work}]`
  )
    .parent()
    .click();

  if (is_prevented_from_accepting_full_time_work_reason) {
    cy.get(
      "[name=availability\\.is_prevented_from_accepting_full_time_work_reason]"
    ).type(is_prevented_from_accepting_full_time_work_reason);
  }
});

Cypress.Commands.add("complete_payment_information", (paymentInformation) => {
  const {
    federal_income_tax_withheld,
    payment_method,
    account_type,
    routing_number,
    account_number,
  } = paymentInformation;

  cy.get(
    `input[id="federal_income_tax_withheld\\.${federal_income_tax_withheld}"]`
  )
    .parent()
    .click();
  cy.get(`input[id="payment\\.payment_method\\.${payment_method}"]`)
    .parent()
    .click();
  cy.get(`input[id="payment\\.account_type\\.${account_type}"]`)
    .parent()
    .click();
  cy.get('input[id="payment\\.routing_number"]').type(routing_number);
  cy.get('input[id="payment\\.re_enter_routing_number"]').type(routing_number);
  cy.get('input[id="payment\\.account_number"]').type(account_number);
  cy.get('input[id="payment\\.re_enter_account_number"]').type(account_number);
});

Cypress.Commands.add(
  "complete_other_pay_information",
  (otherPayInformation) => {
    otherPayInformation.forEach((detail, i) => {
      const { pay_type, total, date_received, note } = detail;
      const [year, month, day] = date_received.split("-");

      cy.get(`input[id="LOCAL_pay_types.${pay_type}"]`).parent().click();
      cy.get(`input[data-testid="other_pay.${i}.total"]`).type(total);
      cy.get(`input[id="other_pay.${i}.date_received.month"]`)
        .clear()
        .type(month);
      cy.get(`input[id="other_pay.${i}.date_received.day"]`).clear().type(day);
      cy.get(`input[id="other_pay.${i}.date_received.year"]`)
        .clear()
        .type(year);
      cy.get(`textarea[id="other_pay.${i}.note"]`).type(note);
    });
  }
);

Cypress.Commands.add("click_yes", (fieldName) => {
  cy.get(`input[id=${fieldName}\\.yes]`).click({ force: true });
});

Cypress.Commands.add("click_no", (fieldName) => {
  cy.get(`input[id=${fieldName}\\.no]`).click({ force: true });
});

Cypress.Commands.add(`verifyCallCount`, (alias, expectedNumberOfCalls) => {
  const resolvedAlias = alias[0] === `@` ? alias.substring(1) : alias;

  cy.get(`${resolvedAlias}.all`).then((calls) => {
    cy.wrap(calls.length).should(`equal`, expectedNumberOfCalls);
  });
});
