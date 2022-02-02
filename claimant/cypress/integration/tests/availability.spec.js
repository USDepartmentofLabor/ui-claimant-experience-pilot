import faker from "@faker-js/faker";

/* eslint-disable no-undef */

context(
  "Availability section of Claim form",
  { scrollBehavior: "center" },
  () => {
    it("navigates availability", () => {
      cy.login(faker.internet.exampleEmail());
      cy.visit("/claimant/claim/availability/");

      const availability = {
        can_begin_work_immediately: "yes",
        cannot_begin_work_immediately_reason: undefined,
        can_work_full_time: "no",
        cannot_work_full_time_reason: "Community obligation 3 days per week.",
        is_prevented_from_accepting_full_time_work: "no",
        is_prevented_from_accepting_full_time_work_reason: undefined,
      };
      cy.complete_availability_information(availability);
      cy.click_next();
      cy.contains("Progress saved").should("be.visible");
    });
  }
);
