// IMPORTANT that the key names and nested structure is consistent with our claim schema
// so that YupBuilder can accurately pull out the 'errors' messages.
const claimForm = {
  step_progress: "step {{step}} of {{totalSteps}}",
  demographic_information: {
    info_alert:
      "We ask for your demographic information only for our reporting requirements. Your responses to these questions won't affect your application or potential payment amount.",
  },
  ssn: {
    label: "Social Security number",
    hint: "Use format 000-00-0000",
    errors: {
      badFormat: "Must use format 000-00-0000",
      required: "Social Security number is required",
    },
    showSsnLabel: "Show SSN",
  },
  birthdate: {
    label: "Date of birth",
    errors: {
      maxDate: "Date must be in the past",
      required: "Date of birth is required",
    },
  },
  sex: {
    label: "What is your sex?",
    options: {
      female: "Female",
      male: "Male",
    },
    required: "Sex is a required field",
  },
  race: {
    label: "What race(s) are you? (Check all that apply)",
    options: {
      american_indian_or_alaskan: "American Indian or Alaskan Native",
      asian: "Asian",
      black: "Black or African American",
      hawaiian_or_pacific_islander: "Native Hawaiian or Other Pacific Islander",
      white: "White",
      opt_out: "Choose not to answer",
    },
    errors: {
      opt_out_only: "You may not choose a race if you opt out",
      required: "Race is a required field",
    },
  },
  ethnicity: {
    label: "Are you Hispanic or Latino?",
    options: {
      hispanic: "Yes",
      not_hispanic: "No",
      opt_out: "Choose not to answer",
    },
    required: "Ethnicity is a required field",
  },
  education_level: {
    label: "What is the highest level of education you have completed?",
    options: {
      none: "No schooling",
      primary_school: "Primary school (pre-school to 8th grade)",
      some_high_school: "Some high school",
      high_school_ged: "High school/GED",
      technical_associates: "Technical or Associates degree",
      bachelors: "Bachelor's degree",
      masters: "Master's degree",
      doctorate: "Ph.D or higher",
      other: "Other",
    },
    required: "At least one education level must be selected",
  },
  work_authorization: {
    authorized_to_work: {
      label: "Are you legally allowed to work in the United States?",
      required: "Please indicate whether you are authorized to work",
    },
    not_authorized_to_work_explanation: {
      label: "Please share more about why you can’t work in the United States:",
      required:
        "Please share more about why you can’t work in the United States",
    },
    authorization_type: {
      label: "Select your authorization:",
      options: {
        US_citizen_or_national: "U.S. citizen/national",
        permanent_resident: "Permanent resident",
        temporary_legal_worker: "Temporary legal worker",
      },
      required: "You must select an authorization status",
    },
    alien_registration_number: {
      label: "Alien registration number",
      required: "Alien registration number is required",
      format:
        "Please enter a valid Alien registration number with format 123-456-789",
    },
  },
  state_credential: {
    drivers_license_or_state_id_number: {
      label: "Driver’s license or state ID number",
      required: "Driver’s license or state ID number is required",
    },
    issuer: {
      label: "State that issued your license/ID",
      required: "Please select the state that issued your license or ID",
    },
  },
  employers: {
    separation: {
      heading: "Separation",
      reason: {
        label: "Why did your job end/your hours change?",
        required: "Separation reason is required",
      },
      option: {
        required: "Please select a separation option",
      },
      comment: {
        required_label: "Please share more details below",
        optional_label: "Please share more details below (optional)",
        errors: {
          required: "More detail about the separation reason is required",
        },
      },
      reasons: {
        laid_off: {
          label: "Laid off",
          description:
            "Your job ended due to lack of work, downsizing, your contract ending, or your place of work closing or moving.",
          option_heading: "What was the reason you were laid off?",
          options: {
            lack_of_work: "Lack of work, including seasonal",
            finished_job: "Finished job/position or contract ended",
            position_eliminated: "Position eliminated/downsizing",
            business_closed: "Business closed or moved out of area",
          },
        },
        fired_discharged_terminated: {
          label: "Fired, discharged, or terminated",
          description:
            "Your employer ended your job, claiming you had performance or behavior issues.",
          option_heading:
            "What was the reason you were fired, discharged, or terminated?",
          options: {
            attendance: "Attendance",
            violation: "Violation of employer policy",
            other: "Other reason",
            none: "No reason provided",
          },
        },
        still_employed: {
          label: "Still employed",
          description:
            "You're still working for your employer, but you may have fewer hours or be on a leave/break.",
          option_heading: "What has changed about your job?",
          options: {
            still_working_hours_unchanged:
              "Still working, hours have not changed",
            hours_reduced_by_employer: "Hours reduced by employer",
            hours_reduced_by_me: "Hours reduced by me",
            shared_work_program: "Shared Work Program",
            leave_of_absence:
              "On a leave of absence (personal, medical, or family medical)",
            temporary: "On a temporary layoff, furloughed",
            still_working_self_employed:
              "Still working, self-employed with this employer",
            suspended: "Suspended",
            school_employee: "School employee, on a break/holiday",
            holiday_vacation: "Holiday/vacation",
          },
        },
        quit: {
          label: "Quit",
          description: "You left your job (this does not include retirement).",
          option_heading: "Why did you quit your job?",
          options: {
            personal: "Personal",
            health: "Health",
            general: "General",
            quit_job: "Quit for another job",
            quit_terminated: "Quit instead of being terminated",
          },
        },
        strike: {
          label: "Strike or lock out by employer",
          description:
            "During a labor dispute, you chose to stop work or your employer stopped work.",
          // unconventional to have a null translation but it's because we leverage this file also for TS types
          option_heading: null,
        },
        retired: {
          label: "Retired",
          description:
            "You have concluded your working career. Retiring can be voluntary or mandatory.",
          option_heading: null,
        },
        shutdown: {
          label: "Federal or State shutdown",
          description: "Your job ended due to lack of government funding.",
          option_heading: null,
        },
      },
    },
    heading: "Your employer",
    reason_for_data_collection:
      "We need the <strong>last 18 months</strong> of your work history to calculate your unemployment benefit amount. List out all your jobs, including jobs you are still working, to avoid delays with your application.",
    errors: {
      required: "This field is required",
    },
    address: {
      heading: "Employer address",
      address1: { label: "Employer address line 1" },
      address2: { label: "Employer address line 2 (optional)" },
      city: { label: "City" },
      state: { label: "State" },
      zipcode: { label: "ZIP Code" },
    },
    name: {
      label: "Employer name",
      hint: "You can usually find your employer or company’s name on your paystub or W2.",
      required: "Employer name is required",
    },
    more_employers: {
      label:
        "Have you worked for any other employers in the last 18 months (including part-time, seasonal, and self-employment)?",
      required:
        "Please indicate whether you have worked for any other employers in the last 18 months",
    },
    first_work_date: {
      label: "Start date for this employer:",
      required: "Start date is required",
    },
    last_work_date: {
      label: "Last day of work for this employer:",
      required: "Last day of work is required",
    },
    same_phone: {
      label:
        "Is the phone number of your physical workplace the same as the number listed above?",
      required:
        "Please indicate if this is the phone number of your physical workplace",
    },
    phones: {
      number: {
        label: "Employer phone number",
        required: "Employer phone number is a required field",
        matches: "Please enter a phone number like (555) 555-1234",
      },
    },
    alt_employer_phone: "Work location phone number",
    same_address: {
      label:
        "Did you work at the physical location you listed for your employer?",
      required:
        "Please indicate if you worked at the physical location you listed for your employer",
    },
    work_site_address: {
      heading: "What physical address did you work at?",
      address1: { label: "Employer address line 1" },
      address2: { label: "Employer address line 2 (optional)" },
      city: { label: "City" },
      state: { label: "State" },
      zipcode: { label: "ZIP Code" },
    },
    no_different_phone: "No, it was a different phone number",
    no_different_address: "No, I worked at a different location",
    fein: {
      label: "FEIN, or Federal Employer Identification Number (optional)",
      hint: "You can usually find your employer's FEIN on your W2 or other tax documents your employer provides.",
      pattern: "The FEIN must match the pattern 12-1234567",
    },
    state_employer_payroll_number: {
      label: "State employer payroll number (optional)",
      hint: "You can find the state employer payroll number on line 15 of your W2.",
    },
    self_employed: {
      label: "Were you self-employed at this job?",
      required: "You must indicate whether you were self-employed at this job",
    },
  },
  self_employment: {
    label: "Self-employment",
    self_employed: {
      label: "Are you currently self-employed?",
      required: "You must indicate whether you are self-employed",
    },
    business_ownership: {
      label: "Do you have ownership in a business of any kind?",
      required: "You must indicate whether you have ownership in a business",
    },
    business_name: {
      label: "Name of business",
      required: "You must indicate the name of the business",
    },
    business_interests: { label: "Your business interests" },
    corporate_officer: {
      label:
        "Are you a corporate officer, or do you own more than 5% of the stock for the company you worked for?",
      required:
        "You must indicate whether you are a corporate officer or own stock in your company",
    },
    corporation_name: {
      label: "Name of corporation",
      required: "You must indicate the name of the corporation",
    },
    related_to_owner: {
      label:
        "Are you related to the owner of any business you worked for during the last 18 months?",
      help_text:
        'Choose "No" unless the business owner is your spouse or child, or if you are a child under 18 working for a parent',
      required:
        "You must indicate whether you are related to the owner of any business you worked for during the last 18 months",
    },
    corporation_or_partnership: {
      label: "Is this business a corporation or partnership?",
      required:
        "You must indicate whether the business is a corporation or a partnership",
    },
  },
  occupation: {
    search: "Search",
    choose_the_occupation:
      "Choose the occupation that best matches what you entered above. If nothing matches, please try another search.",
    what_is_your_occupation: {
      label: "What is your occupation?",
      required: "Occupation is required",
      min_length: "Occupation must be at least three characters",
    },
    hint: "If you're not sure, see our",
    list_of_occupations: "list of occupations",
    short_description: {
      label: "Give a short description of your job:",
      required: "Job description is required",
    },
    bls_code: {
      required: "Please select the occupation that best matches your selection",
    },
    no_results: "No results. Try another search.",
  },
  disability: {
    heading: "Disability",
    has_collected_disability: {
      label:
        "Since your last day worked, have you received disability or workers' compensation payments?",
      required:
        "You must indicate whether you have received disability or workers' compensation",
      help_text:
        "Pandemic Unemployment Assistance (PUA) and Social Security (SSI/SSDI) payments are not included. Choose “No” if you received payments from these programs.",
    },
    disabled_immediately_before: {
      label:
        "Were you disabled in the last 4 weeks before filling out this application?",
    },
    type_of_disability: {
      label: "What plan do you get your payment from?",
      options: {
        state_plan: "State Plan",
        private_plan: "Private Plan",
        workers_compensation: "Worker's Compensation",
      },
    },
    date_disability_began: { label: "Date disability began" },
    recovery_date: { label: "Recovery date (optional)" },
    contact_employer_after_recovering: {
      label:
        "After recovering, did you contact your last employer for more work?",
    },
  },
  education_vocational_rehab: {
    education: {
      heading: "Your education",
      attending_training: {
        label: "Are you currently attending school, college, or job training?",
        required:
          "You must indicate whether you are currently attending school, college, or job training",
        help_text:
          'If you are in union-required training or paid job training, choose "No."',
      },
      training_type: {
        label: "Select what best matches your situation:",
        options: {
          part_time_student_outside_working_hours:
            "Part-time student, outside of your typical working hours",
          part_time_student_during_working_hours:
            "Part-time student, during your typical working hours",
          part_time_student_online_classes_only:
            "Part-time student, online classes only",
          full_time_student: "Full time student, in-person or online",
        },
        error: {
          required: "Select the best match for your current situation",
        },
      },
      full_time_student: {
        label: "Have you been a full-time student during the last 18 months?",
        required:
          "You must indicate whether you have been a full-time student during the last 18 months",
      },
    },
    vocational_rehab: {
      heading: "Vocational rehabilitation",
      is_registered: {
        label: "Are you currently registered with Vocational Rehabilitation?",
        required:
          "You must indicate whether you are currently registered with Vocational Rehabilitation",
        help_text: {
          description:
            "Vocational Rehabilitation is a program that helps people living with disabilities find and keep jobs.",
          learn_more_here:
            "<extLink>Learn more here<span>opens in a new tab</span><icon></icon></extLink>",
        },
      },
    },
  },
  union: {
    heading: "Union membership",
    is_union_member: {
      label: "Are you a member of a union?",
      required: "You must indicate whether you are a member of a union",
    },
    union_name: {
      label: "Name of your union",
      required: "You must indicate the name of your union",
    },
    union_local_number: {
      label: "Union local number",
      required: "You must indicate your union local number",
    },
    required_to_seek_work_through_hiring_hall: {
      label:
        "Are you required to seek work through a union hiring hall (a job placement office operated by your union)?",
      required:
        "You must indicate whether you are required to seek work through a union hiring hall",
    },
  },
  availability: {
    can_begin_work_immediately: {
      label: "Can you begin work immediately?",
      required: "You must indicate whether you can begin work immediately",
    },
    can_work_full_time: {
      label: "Can you work full time?",
      required: "You must indicate whether you can work full time",
    },
    is_prevented_from_accepting_full_time_work: {
      label: "Is anything preventing you from accepting work?",
      required:
        "You must indicate whether anything prevents you from accepting work",
    },
    cannot_begin_work_immediately_reason: {
      label: "Please share more about what's preventing you from working:",
      required: "A reason you cannot begin work immediately is required",
    },
    cannot_work_full_time_reason: {
      label: "Please share more about why you can’t work full time:",
      required: "A reason you cannot work full-time is required",
    },
    is_prevented_from_accepting_full_time_work_reason: {
      label:
        "Please share more about what’s preventing you from working full time:",
      required: "A reason you cannot accept full-time work is required",
    },
  },
  contact_information: {
    more_phones: "Add another phone number",
    email: "Email address", // no label, not editable
    interpreter_required: {
      label: "Do you need an interpreter to communicate with us?",
      required: "You must indicate whether you need an interpreter",
    },
    preferred_language: {
      label: "What language do you speak?",
      required: "Please indicate the language you speak",
    },
  },
  address: {
    address1: { required: "Address is required" },
    city: { required: "City is required" },
    state: { required: "State is required" },
    zipcode: {
      required: "ZIP Code is required",
      format: "ZIP Code must be five digits",
    },
  },
  phone: {
    number: {
      required: "Phone number is required",
      matches: "Please enter a phone number like (555) 555-1234",
    },
    type: { required: "Phone type is required" },
  },
  date: {
    typeError:
      "{{ fieldName}} must be a valid date with format {{ dateFormat }}",
    required: "{{ fieldName }} is required",
  },
  name: {
    legal_name: "What is your legal name?",
    alternate_name: "Additional name",
    first_name: { label: "First name", required: "First name is required" },
    middle_name: { label: "Middle initial (optional)" },
    last_name: { label: "Last name", required: "Last name is required" },
    claimant_has_alternate_names: {
      label:
        "In the last 18 months, have you worked under a name different from your legal name?",
      required:
        "You must indicate if you have worked under a different name in the past 18 months",
    },
  },
  payment: {
    federal_income_tax_withheld: {
      label:
        "Would you like to have 10% federal income tax withheld from your benefits payments?",
      help_text:
        "Federal tax withholding will only be made after amounts are deducted and withheld for any unemployment overpayments, child support obligations, or any other amounts required to be deducted and withheld by law.",
      errors: {
        required: "Your tax withholding preference is required",
      },
    },
    payment_method: {
      label: "How would you like to receive your benefits payments?",
      options: {
        debit: "Prepaid debit card mailed to me",
        direct_deposit: "Direct deposit to my bank account",
      },
      errors: {
        required: "Your payment preference is required",
      },
    },
    account_type: {
      label: "Account type",
      options: {
        checking: "Checking",
        savings: "Savings",
      },
      errors: {
        required: "Account type is required",
      },
    },
    routing_number: {
      label: "Routing number",
      errors: { required: "Routing number is required" },
    },
    re_enter_routing_number: {
      label: "Re-enter routing number",
      errors: {
        mustMatch: "Must match routing number",
        required: "Re-enter routing number is required",
      },
    },
    account_number: {
      label: "Account number",
      errors: { required: "Account number is required" },
    },
    re_enter_account_number: {
      label: "Re-enter account number",
      errors: {
        mustMatch: "Must match account number",
        required: "Re-enter account number is required",
      },
    },
  },
  other_pay_detail: {
    pay_type: {
      label:
        "Have you received any payments from your employer(s) since becoming unemployed?",
      required: "At least one option must be selected",
      options: {
        vacation_sick_pto: {
          label: "Vacation/sick/PTO pay",
          description:
            "Pay you received for approved time off or a pay out of unused time off",
        },
        final_paycheck: {
          label: "Final paycheck",
          description:
            "Pay you received for hours you worked prior to your last day of work",
        },
        pension_annuity_retirement: {
          label: "Pension, annuity, or retirement pay",
          description:
            "Pay you received from a retirement plan associated with an employer you listed on this application (not a loan)",
        },
        severance: {
          label: "Severance pay",
          description:
            "Pay you received from your employer when you're dismissed from your job",
        },
        profit_sharing: {
          label: "Profit sharing",
          description:
            "A share in your company's profits based on your yearly salary",
        },
        other: {
          label: "Other type of pay",
          description: "",
        },
        no_other_pay: {
          label: "I have not received any other pay",
          description: "",
          ariaDescription: "Selecting this disables all other pay options",
        },
      },
    },
    total: {
      label: "Total {{- payType }} received",
      currencyPrefix: "$",
      errors: {
        required: "Total pay is required, in dollars",
        min: "Total pay must be greater than 0",
        number:
          "Total must be a number in dollars or cents, like 150, or 150.75",
      },
    },
    date_received: {
      label: "Date {{- payType }} received",
      errors: {
        required: "Date received is required",
        max: "Date must be today or in the past",
        label: "Date received",
      },
    },
    note: {
      label: "Please share more about your {{- payType }} received",
      errors: {
        required: "Please provide further details",
      },
    },
  },
  legal_affirmation: {
    required: "You must confirm the affirmation statement by checking the box",
    label:
      "I gave true answers to all questions. I know that there may be legal punishments for giving false answers.",
  },
  is_complete: { label: "I'm done!", required: "You must check the box" },
  is_complete_description:
    "Checking this box means your claim will be sent to your workforce agency",
  validation_alert_one: "Correct the error on this page to proceed",
  validation_alert_other:
    "Correct the {{ count }} errors on this page to proceed",
  verified_by_idp: {
    heading: "The following information has been added to your application:",
    to_edit_visit: "To edit your information, visit",
    idp_url_text: "login.gov",
  },
};

export default claimForm;
