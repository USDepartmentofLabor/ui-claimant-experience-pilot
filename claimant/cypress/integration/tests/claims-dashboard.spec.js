import faker from "@faker-js/faker";

/* eslint-disable no-undef */

context("/claims/ dashboard", { scrollBehavior: "center" }, () => {
  context("LD flag on", () => {
    beforeEach(() => {
      cy.intercept("GET", "**/sdk/evalx/**", {
        body: {
          "show-claims-dashboard": {
            version: 1,
            flagVersion: 1,
            value: true,
            variation: 0,
            trackEvents: false,
          },
        },
      }).as("get-flags");
    });
    it("shows menu link, dashboard", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/occupation/");
      cy.wait("@get-flags");
      cy.complete_occupation_form({
        title: "registered nurse",
        description: "I am a nurse",
        bls_code: "29-1141.00",
      });
      cy.click_next();
      cy.contains("Progress saved").should("be.visible");
      cy.get('a[href*="claims"]').click();
      cy.contains("In Process").should("be.visible");
    });
  });

  context("LD flag off", () => {
    it("does not show menu link, dashboard", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/occupation/");
      cy.complete_occupation_form({
        title: "registered nurse",
        description: "I am a nurse",
        bls_code: "29-1141.00",
      });
      cy.click_next();
      cy.contains("Progress saved").should("be.visible");
      cy.get('a[href*="claims"]').should("not.exist");

      cy.visit("/claimant/claims/");
      cy.contains("we could not find that page").should("be.visible");
    });
  });
});
