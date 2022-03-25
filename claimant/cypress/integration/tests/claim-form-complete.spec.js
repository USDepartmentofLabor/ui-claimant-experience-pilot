import faker from "@faker-js/faker";
import { FAKE_BIRTHDATE, FAKE_SSN } from "../../support/commands";
/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: "center" }, () => {
  it("saves completed claim (also checks a11y on each page)", () => {
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
    });
    cy.contains("Next: Contact information");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    cy.complete_contact_information();
    cy.contains("Next: Demographics");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    cy.complete_demographic({
      sex: "female",
      ethnicity: "not_hispanic",
      races: ["asian", "hawaiian_or_pacific_islander"],
    });
    cy.contains("Next: Identity information");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    const identityInformation = {
      ssn: FAKE_SSN,
      birthdate: FAKE_BIRTHDATE,
      idNumber: "123-myId",
      issuingState: "GA",
      authorizedToWork: true,
      authorizationType: "US_citizen_or_national",
    };

    cy.complete_identity_information(identityInformation);
    cy.contains("Next: Add employer");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

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
      self_employed: false,
      separation: {
        reason: "laid_off",
        option: "position_eliminated",
        comment: "they ran out of money",
      },
    };
    cy.complete_employer_form(employer0);
    cy.click_more_employers("no");
    cy.contains("Next: Your recent work history");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    // employer-review
    cy.contains("Next: Self-employment");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

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
    cy.contains("Next: Other pay");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    const otherPay = [
      {
        pay_type: "severance",
        total: 5000.25,
        date_received: "2021-01-15",
        note: "All one payment for layoff",
      },
    ];
    cy.complete_other_pay_information(otherPay);
    cy.contains("Next: Occupation information");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");
    // Occupation page
    cy.complete_occupation_form({
      title: "registered nurse",
      description: "I am a nurse",
      bls_code: "29-1141.00",
    });
    cy.contains("Next: Education and training");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    // Education and Vocational Rehab page
    const educationVocation = {
      attending_college_or_job_training: "yes",
      type_of_college_or_job_training: "full_time_student",
      registered_with_vocational_rehab: "no",
      education_level: "bachelors",
    };
    cy.complete_education_vocational_information(educationVocation);
    cy.contains("Next: Union membership");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    cy.complete_union_form({
      is_union_member: true,
      required_to_seek_work_through_hiring_hall: true,
      union_name: "United ACME",
      union_local_number: "12345",
    });
    cy.contains("Next: Disability");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    // Disability status page
    const disabilityStatus = {
      has_collected_disability: "yes",
      disabled_immediately_before: "no",
      type_of_disability: "State Plan",
      date_disability_began: "01/01/2020",
      recovery_date: "05/02/2020",
      contacted_last_employer_after_recovery: "yes",
    };
    cy.complete_disability_status_information(disabilityStatus);
    cy.contains("Next: Availability");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    //Availability page
    const availability = {
      can_begin_work_immediately: "yes",
      cannot_begin_work_immediately_reason: undefined,
      can_work_full_time: "no",
      cannot_work_full_time_reason: "Community obligation 3 days per week.",
      is_prevented_from_accepting_full_time_work: "no",
      is_prevented_from_accepting_full_time_work_reason: undefined,
    };
    cy.complete_availability_information(availability);
    cy.contains("Next: Payment");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    // Payment information page
    const paymentInformation = {
      federal_income_tax_withheld: "no",
      payment_method: "direct_deposit",
      account_type: "checking",
      routing_number: "12345",
      account_number: "abcdefg",
    };
    cy.complete_payment_information(paymentInformation);
    cy.contains("Next: Review");
    cy.check_a11y();
    cy.click_next();
    cy.get("h1").should("have.focus");

    // Review page
    cy.click_legal_affirmation();
    cy.check_a11y();
    cy.click_finish();
    cy.url().should("contain", "/claimant/");
    cy.url().should("not.include", "/claim/review");
    cy.click_final_submit();
    cy.url().should("contain", "success");
    cy.contains("Success!").should("be.visible");
    // Should no longer allow the claim form to be accessed
    cy.visit("/claimant/");
    cy.contains("Application submitted").should("be.visible");
  });
});
