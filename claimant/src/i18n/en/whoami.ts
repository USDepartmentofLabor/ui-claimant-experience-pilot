const whoami = {
  heading: "Who am I",
  intro: "Displays the account attributes from the AAL2/IAL2 session",
  info: {
    firstName: "First Name: {{firstName}}",
    lastName: "Last Name: {{lastName}}",
    dob: "Birthdate: {{-dob}}", // the '-' unescapes the slash symbols
    email: "Email: {{email}}",
    ssn: "SSN: {{ssn}}",
    phone: "Phone: {{phone}}",
    address1: "Address (1): {{address1}}",
    address2: "Address (2): {{address2}}",
    city: "City: {{city}}",
    state: "State: {{state}}",
    zipcode: "ZIP code: {{zipcode}}",
    SWA: "SWA: {{SWA}}",
    SWAName: "SWA Name: {{SWAName}}",
    SWAClaimantUrl: "SWA Claimant Url: {{- SWAClaimantUrl}}",
    claim: "Claim: {{claim}}",
  },
};

export default whoami;
