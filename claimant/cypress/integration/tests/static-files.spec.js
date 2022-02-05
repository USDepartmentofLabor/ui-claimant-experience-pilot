/* eslint-disable no-undef */

// Test that static files are served from the root path
// in addition to the /static/ path

context("Static files", () => {
  // favicon.ico
  it("Visits favicon in root path", () => {
    cy.request("/favicon.ico");
  });

  it("Visits favicon in static path", () => {
    cy.request("/static/favicon.ico");
  });

  // manifest.json
  it("Visits manifest in root path", () => {
    cy.request("/manifest.json");
  });

  it("Visits manifest in static path", () => {
    cy.request("/static/manifest.json");
  });

  // claim schema
  it("Visits claim schema in root path", () => {
    cy.request("/schemas/claim-v1.0.json");
  });

  it("Visits claim schema in static path", () => {
    cy.request("/static/schemas/claim-v1.0.json");
  });
});
