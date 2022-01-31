import faker from "faker";

/* eslint-disable no-undef */
context("Other Pay section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates other pay", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/other-pay/");
    const otherPay = [
      {
        pay_type: "severance",
        total: 500000,
        date_received: "2021-01-15",
        note: "All one payment for layoff",
      },
    ];
    cy.complete_other_pay_information(otherPay);
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");
  });
});
