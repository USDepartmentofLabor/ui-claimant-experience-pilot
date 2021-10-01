/* eslint-disable no-undef */

context("Initial Claim form", { scrollBehavior: false }, () => {
  it("sends test email", () => {
    cy.login();
    cy.on('window:alert', (str) => {
      expect(str).to.equal("Email sent to someone@example.com");
    });
    cy.visit("/claimant/");
    cy.get("[data-testid='button']").contains("Test Email").click();
  });
});
