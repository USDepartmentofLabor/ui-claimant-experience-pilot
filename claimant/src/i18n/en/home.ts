const home = {
  welcome: "Welcome",
  namelessWelcome: "Welcome to [PILOT NAME]!",
  intro: "File an unemployment insurance claim.",
  sampleStyle: "Hello from a CSS Module style",
  sampleForm: {
    claimSuccess: "Claim submitted with ID",
  },
  label: {
    email: "Email",
    birthdate: "Birthdate",
    ssn: "Social Security number",
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
    complete: "Complete",
    save_message:
      "Your progress is automatically saved when you complete a page and click “Next.”",
  },
  status: {
    label: "Status",
    not_started: "Not started",
    deleted: "Not started",
    in_progress: "In progress",
    complete: "Complete",
  },
  remaining_tasks: {
    one: "You have one remaining task to apply for unemployment benefits:",
    two: "Complete the following two tasks to apply for unemployment benefits.",
    listTitle: "To apply online, you will:",
    resetMessage:
      "You will need to begin a new application; for security reasons, your previous application was reset on {{ resetDate }} due to inactivity.",
  },
  identity: {
    list: "Verify your identity",
    not_started: {
      title: "Verify your identity",
      description:
        "Verifying your identity with Login.gov speeds up processing " +
        "time for your application and helps make sure your benefits " +
        "payments are secure.",
      start: "Start ID verification",
    },
    complete: {
      title: "Identity verified",
      description:
        "View on <extLink>Login.gov<span>opens in a new tab</span><icon></icon></extLink>",
    },
    moreInfo: {
      title: "To verify your identity, you'll need the following",
      content: [
        "Your state-issued ID",
        "A phone or computer with a camera to take a picture of yourself (not always required)",
        "Your Social Security number",
        "A phone number on a phone plan in your name. (If you don't have a phone plan in your name, we can mail you a verification code, which will take 3-5 days.)",
      ],
    },
  },
  application: {
    list: "Complete your application",
    edit: "Edit",
    ready_to_submit: {
      title: "Application ready to submit",
    },
    not_ready_to_submit: {
      title: "Fill out your application",
      description:
        "Provide information about yourself, your work history, " +
        "and how you'd like to get benefits payments.",
      start_application: "Start application",
      continue: "Continue",
      delete_application: "Delete application",
    },
    expiration_warning:
      "Update application by <strong>{{when}}</strong> or application will be reset due to inactivity.",
    moreInfo: {
      title: "To fill out your application, you'll need this information",
      content: [
        "Your personal information: your name, Social Security Number, birthdate, and contact information.",
        "Your Alien Registration Number (if you're not a U.S. citizen)",
        "Your complete work history for the last 18 months, including:",
        "Details about other types of payments you receive(d)",
        "Military form DD-214 (if you were in the military in the last 18 months)",
        "Form SF-8 or SF-50 (if you were a federal employee during the last 18 months)",
        "Your bank account information (if you'd like to get your benefits by direct deposit)",
      ],
      workHistoryContent: [
        "Employer name(s)",
        "Employer address(es)",
        "Employer phone number(s)",
        "Start and end dates for each job",
        "A reason why each job ended, or why your hours changed",
      ],
    },
  },
  afterApply: {
    title: "After you apply",
    content: "Text TBD",
  },
  moreInformation: {
    title: "More information",
    contactUs: "Contact us",
    about: "About [PILOT NAME]",
  },

  disclaimer: "[STANDARD LEGAL DISCLAIMER]",
  success: {
    title: "Success!",
    heading: "Application submitted",
    message:
      "You submitted your application <claimId>{{claimId}}</claimId> on {{completedDate}}.",
    next_steps: "Next steps",
  },
  timeout: {
    title: "You will be logged out due to inactivity in ",
    stay_logged_in: "Stay logged in",
    log_out: "Log out",
    instructions:
      "Click the button below to stay logged in. Otherwise, to protect your" +
      " data, your progress will be saved, but you will be logged out.",
    sr_countdown_zero: "{{seconds}} seconds",
    sr_countdown_one: "{{count}} minute, {{seconds}} seconds",
    sr_countdown_other: "{{count}} minutes, {{seconds}} seconds",
  },
  today: "today",
  expires_at_time: "at 11:59:59pm",
  submit_claim_card: {
    submit_application_button: "Submit application",
    title: "Submit your application to {{stateName}}",
    error: {
      heading: "There was a problem",
      body: "We had trouble submitting your application. Please try again or contact us.",
    },
  },
};

export default home;
