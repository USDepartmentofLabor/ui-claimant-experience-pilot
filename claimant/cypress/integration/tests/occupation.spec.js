import faker from "@faker-js/faker";

/* eslint-disable no-undef */

context(
  "Occupation section of Claim form",
  { scrollBehavior: "center" },
  () => {
    it("navigates occupation", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/occupation/");
      cy.complete_occupation_form({
        title: "registered nurse",
        description: "I am a nurse",
        page: 3,
        bls_code: "29-1141.02",
      });
      cy.click_next();
      cy.contains("Progress saved").should("be.visible");
    });
  }
);
