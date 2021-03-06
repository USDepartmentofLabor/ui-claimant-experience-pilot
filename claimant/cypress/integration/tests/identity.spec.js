import faker from "@faker-js/faker";
import { FAKE_BIRTHDATE, FAKE_SSN } from "../../support/commands";

/* eslint-disable no-undef */

context("Identity section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates Identity Information when authorized to work", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/identity/");

    const identityInformation = {
      ssn: FAKE_SSN,
      birthdate: FAKE_BIRTHDATE,
      idNumber: "123-myId",
      issuingState: "GA",
      authorizedToWork: true,
      authorizationType: "US_citizen_or_national",
    };
    cy.complete_identity_information(identityInformation);
    cy.click_next();
  });

  it("navigates Identity Information when authorized to work and not citizen", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/identity/");

    const identityInformation = {
      ssn: FAKE_SSN,
      birthdate: FAKE_BIRTHDATE,
      idNumber: "123-myId",
      issuingState: "GA",
      authorizedToWork: true,
      authorizationType: "permanent_resident",
      alienRegistrationNumber: "111-111-111",
    };
    cy.complete_identity_information(identityInformation);
    cy.click_next();
  });

  it("navigates Identity Information when not authorized to work", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/identity/");

    const identityInformation = {
      ssn: FAKE_SSN,
      birthdate: FAKE_BIRTHDATE,
      idNumber: "123-myId",
      issuingState: "GA",
      authorizedToWork: false,
      notAuthorizedToWorkExplanation: "I can't work in the US because ...",
    };
    cy.complete_identity_information(identityInformation);
    cy.click_next();
  });
});
