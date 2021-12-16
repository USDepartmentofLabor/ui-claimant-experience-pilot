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
    SWA: "SWA: {{SWA}}",
    SWAName: "SWA Name: {{SWAName}}",
    SWAClaimantUrl: "SWA Claimant Url: {{- SWAClaimantUrl}}",
    claim: "Claim: {{claim}}",
  },
};

export default whoami;
