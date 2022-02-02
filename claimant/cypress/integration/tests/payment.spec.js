import faker from "@faker-js/faker";

/* eslint-disable no-undef */
context("Payment section of Claim form", { scrollBehavior: "center" }, () => {
  it("navigates payment", () => {
    cy.login(faker.internet.exampleEmail());
    cy.visit("/claimant/claim/payment/");
    const paymentInformation = {
      federal_income_tax_withheld: "no",
      payment_method: "direct_deposit",
      account_type: "checking",
      routing_number: "12345",
      account_number: "abcdefg",
    };
    cy.complete_payment_information(paymentInformation);
    cy.click_next();
    cy.contains("Progress saved").should("be.visible");
  });
});
