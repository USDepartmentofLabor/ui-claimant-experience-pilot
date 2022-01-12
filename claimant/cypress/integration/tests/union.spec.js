/* eslint-disable no-undef */

context("Union section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates occupation", () => {
    cy.mock_login();
    cy.mock_partial_success();
    cy.visit("/claimant/claim/union/");
    cy.complete_union_form({
      is_union_member: true,
      required_to_seek_work_through_hiring_hall: true,
      union_name: "United ACME",
      union_local_number: "12345",
    });
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");
  });
});
