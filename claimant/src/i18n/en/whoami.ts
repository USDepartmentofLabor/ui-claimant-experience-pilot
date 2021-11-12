const whoami = {
  heading: "Who am I",
  intro: "Displays the account attributes from the AAL2/IAL2 session",
  info: {
    formId: "Form ID: {{formId}}",
    firstName: "First Name: {{firstName}}",
    lastName: "Last Name: {{lastName}}",
    dob: "Birthdate: {{-dob}}", // the '-' unescapes the slash symbols
    email: "Email: {{email}}",
    ssn: "SSN: {{ssn}}",
    phone: "Phone: {{phone}}",
    SWA: "SWA: {{SWA}}",
    claim: "Claim: {{claim}}",
  },
};

export default whoami;
