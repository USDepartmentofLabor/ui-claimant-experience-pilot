/* eslint-disable no-undef */

context("API", { scrollBehavior: "center" }, () => {
  it("logs in and reports back personal data", () => {
    cy.login();
    // note that this is a direct browser request, not XHR, so no need to intercept it.
    cy.request("/api/whoami/").then((response) => {
      const whoami = response.body;
      expect(whoami.email).to.eq("someone@example.com");
    });
  });
});
