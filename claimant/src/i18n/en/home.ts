const home = {
  welcome: "Welcome",
  intro: "File an unemployment insurance claim.",
  sampleStyle: "Hello from a CSS Module style",
  sampleForm: {
    claimButton: "Test Claim",
    claimSuccess: "Claim submitted with ID",
  },
  label: {
    email: "Email",
    birthdate: "Birthdate",
    ssn: "Social Security Number",
  },
  validation: {
    required: "This field is required",
    notEmail: "This is not a valid email",
    email_does_not_match: "Confirmation email does not match",
    notZipCode: "This is not a valid zip code",
  },
  pagination: {
    next: "Next",
    previous: "Back",
    save_and_exit: "Save and exit",
  },
  claimAlreadySubmitted:
    "Sorry, you have a Claim currently being processed by {{ swaName }}. " +
    "Please contact them at <0>{{- swaClaimantUrl }}</0> to resolve your open claim.",
};

export default home;
