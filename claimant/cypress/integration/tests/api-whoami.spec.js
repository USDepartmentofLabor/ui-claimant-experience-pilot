/* eslint-disable no-undef */

context("API", { scrollBehavior: false }, () => {
  it("logs in and reports back personal data", () => {
    cy.login();
    cy.request("/api/whoami").then((response)=>{
      const whoami = response.body;
      expect(whoami.email).to.eq("someone@example.com");
    });
  });
});
