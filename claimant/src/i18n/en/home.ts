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
  status: {
    label: "Status",
    not_started: "Not started",
    in_progress: "In progress",
    complete: "Complete",
    ready_to_submit: "Ready to submit",
  },
  remaining_tasks: {
    one: "You have one remaining task to apply for unemployment benefits:",
    two: "Complete the following two tasks to apply for unemployment benefits:",
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
  },
  application: {
    list: "Complete your application",
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
  },
  success: {
    just_finished: {
      title: "Success!",
      message: "Success message for claim {{claim_id}}",
    },
    returning: {
      title: "Welcome back!",
      message: "Welcome back message for completed claim {{claim_id}}",
    },
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
};

export default home;
