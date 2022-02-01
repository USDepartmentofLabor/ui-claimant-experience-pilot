// IMPORTANT that the key names and nested structure is consistent with our claim schema
// so that YupBuilder can accurately pull out the 'errors' messages.
const claimForm = {
  ssn: {
    label: "Social Security Number",
    required: "Social Security Number is required",
  },
  birthdate: {
    label: "Date of birth",
    required: "Date of birth is required",
  },
  sex: {
    label: "Sex",
    options: {
      female: "Female",
      male: "Male",
    },
    required: "Sex is a required field",
  },
  race: {
    label: "What races do you identify with?",
    options: {
      american_indian_or_alaskan: "American Indian or Alaska Native",
      asian: "Asian",
      black: "Black or African American",
      hawaiian_or_pacific_islander: "Native Hawaiian or Other Pacific Islander",
      white: "White",
    },
    required: "Race is a required field",
  },
  ethnicity: {
    label: "Do you identify as Hispanic or Latino?",
    options: {
      opt_out: "Choose not to answer",
      hispanic: "Yes",
      not_hispanic: "No",
    },
    required: "Ethnicity is a required field",
  },
  education_level: {
    label: "How many years of education have you finished?",
    options: {
      none: "No schooling completed",
      nursery: "Nursery school",
      grades_1_to_11: "Grades 1 through 11",
      grade_12: "12th grade--no diploma",
      high_school_grad: "Regular high school diploma",
      ged: "GED or alternative credential",
      some_college: "Some college credit, but less than 1 year of college",
      one_year_college_plus: "1 or more years of college credit, no degree",
      associates: "Associates degree (for example: AA, AS)",
      bachelors: "Bachelor's degree (for example: BA, BS)",
      masters: "Master's degree (for example: MA, MS, MEng, MEd, MSW, MBA)",
      professional:
        "Professional degree beyond bachelor's degree (for example: MD, DDS, DVM, LLB, JD)",
      doctorate: "Doctorate degree (for example, PhD, EdD)",
    },
    required: "At least one education level must be selected",
  },
  work_authorization: {
    authorized_to_work: {
      label: "Are you legally allowed to work in the United States?",
      required: "Please indicate whether you are authorized to work",
    },
    not_authorized_to_work_explanation: {
      label:
        "Please provide more information about why you aren’t able to work in the United States:",
      required:
        "Please provide more information about why you aren’t able to work in the United States",
    },
    authorization_type: {
      label: "Select your authorization:",
      options: {
        US_citizen_or_national: "U.S. Citizen/National",
        permanent_resident: "Permanent Resident",
        temporary_legal_worker: "Temporary Legal Worker",
      },
      required: "You must select an authorization status",
    },
    alien_registration_number: {
      label: "Alien Registration Number",
      required: "Alien Registration Number is required",
      format:
        "Please enter a valid Alien Registration Number with format 123-456-789",
    },
  },
  identity: {
    heading: "Identity",
  },
  state_credential: {
    drivers_license_or_state_id_number: {
      label: "Drivers License or State ID number",
      required: "Drivers License or State ID number is required",
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
        label: "What was your reason for separation?",
        required: "Separation reason is required",
      },
      option: {
        required: "Please select a separation option",
      },
      comment: {
        required_label: "Please share any additional details below",
        optional_label: "Please share any additional details below (optional)",
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
            absent_tardy: "Absent/tardy",
            drinking_drugs: "Drinking/drugs/drug test",
            insubordination: "Insubordination/disobedience",
            sleeping: "Sleeping",
            fighting: "Fighting",
            military: "Military",
            general: "General",
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
          description:
            "You voluntarily left your job (this does not include retirement).",
          option_heading: "Why did you quit your job?",
          options: {
            emergency: "Personal emergency",
            health: "Health",
            general: "General",
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
    heading: "Your most recent employer:",
    reason_for_data_collection:
      "We need the <strong>last 18 months</strong> of your work history because it helps calculate your unemployment benefit amount. Include all your jobs to avoid delays with your application",
    errors: {
      required: "This field is required",
    },
    address: {
      address1: { label: "Employer address line 1" },
      address2: { label: "Employer address line 2 (optional)" },
      city: { label: "City" },
      state: { label: "State" },
      zipcode: { label: "ZIP code" },
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
      label: "Is this the phone number of the location where you worked?",
      required:
        "Please indicate if this is the phone number of the location where you worked",
    },
    phones: {
      number: {
        label: "Employer phone number",
        errors: {
          required: "Employer phone number is a required field",
        },
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
      heading: "Your work location address:",
      address1: { label: "Employer address line 1" },
      address2: { label: "Employer address line 2" },
      city: { label: "City" },
      state: { label: "State" },
      zipcode: { label: "ZIP code" },
    },
    no_different_phone: "No, it was a different phone number",
    no_different_address: "No, I worked at a different location",
    fein: {
      label: "FEIN, or Federal Employer Identification Number (optional)",
      hint: "You can usually find your employer's FEIN on your W2 or other tax documents your employer provides.",
    },
  },
  self_employment: {
    label: "Self-employment",
    self_employed: {
      label: "Are you self-employed?",
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
      "Choose the occupation that best matches your selection above. If nothing matches, please try another search.",
    heading: "Your occupation",
    what_is_your_occupation: {
      label: "What is your occupation?",
      required: "Occupation is required",
    },
    hint: "If you're not sure, see our",
    list_of_occupations: "list of occupations",
    short_description: {
      label: "Short description of your job",
      required: "Job description is required",
    },
    bls_code: {
      required: "Please select the occupation that best matches your selection",
    },
    no_results: "", // TODO?
    opens_in_a_new_tab: "opens in a new tab",
  },
  disability: {
    heading: "Disability",
    has_collected_disability: {
      label:
        "Since your last day worked, have you collected disability or worker's compensation?",
      required:
        "You must indicate whether you have collected disability or worker's compensation",
    },
    disabled_immediately_before: {
      label:
        "Were you disabled immediately before filling out this application?",
    },
    type_of_disability: { label: "Type of disability" },
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
      full_time_student: {
        label: "Have you been a full-time student during the last 18 months?",
        required:
          "You must indicate whether you have been a full-time student during the last 18 months",
      },
      attending_training: {
        label: "Are you currently attending college or job training?",
        required:
          "You must indicate whether you are currently attending college or job training",
      },
    },
    vocational_rehab: {
      heading: "Vocational rehabilitation",
      is_registered: {
        label: "Are you currently registered with Vocational Rehabilitation?",
        required:
          "You must indicate whether you are currently registered with Vocational Rehabilitation",
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
    heading: "Your availability to work",
    can_begin_work_immediately: {
      label: "Can you begin work immediately?",
      required: "You must indicate whether you can begin work immediately",
    },
    can_work_full_time: {
      label: "Can you work full time?",
      required: "You must indicate whether you can work full time",
    },
    is_prevented_from_accepting_full_time_work: {
      label: "Is anything preventing you from accepting full-time work?",
      required:
        "You must indicate whether anything prevents you from accepting full-time work",
    },
    cannot_begin_work_immediately_reason: {
      required: "A reason you cannot being work immediately is required",
    },
    cannot_work_full_time_reason: {
      required: "A reason you cannot work full-time is required",
    },
    is_prevented_from_accepting_full_time_work_reason: {
      required: "A reason you cannot accept full-time work is required",
    },
  },
  contact_information: {
    what_is_your_contact_information: "What is your contact information?",
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
    zipcode: { required: "ZIP code is required" },
  },
  phone: {
    number: { required: "Phone number is required" },
    type: { required: "Phone type is required" },
  },
  name: {
    legal_name: "Legal Name",
    alternate_name: "Alternate Name",
    first_name: { label: "First Name", required: "First Name is required" },
    middle_name: { label: "Middle Name (Optional)" },
    last_name: { label: "Last Name", required: "Last Name is required" },
    claimant_has_alternate_names: {
      label:
        "In the past 18 months, have you worked under a name different from above?",
    },
  },
  payment: {
    federal_income_tax_withheld: {
      label:
        "Would you like to have 10% Federal Income Tax withheld from your benefits?",
      help_text:
        "Federal tax withholding will only be made after amounts are deducted and withheld for any unemployment overpayments, child support obligations, or any other amounts required to be deducted and withheld by law.",
    },
    payment_method: {
      label: "How would you like to receive your benefit payment?",
      options: {
        debit: "Debit card mailed to me",
        direct_deposit: "Direct deposit to my bank account",
      },
    },
    account_type: {
      label: "Account type",
      options: {
        checking: "Checking",
        savings: "Savings",
      },
    },
    routing_number: { label: "Routing number" },
    re_enter_routing_number: {
      label: "Re-enter routing number",
      errors: { mustMatch: "Must match routing number" },
    },
    account_number: { label: "Account number" },
    re_enter_account_number: {
      label: "Re-enter account number",
      errors: { mustMatch: "Must match account number" },
    },
  },
  other_pay_detail: {
    pay_type: {
      label:
        "Have you received any payments from your employer(s) since becoming unemployed?",
      options: {
        paid_time_off: {
          label: "Paid Time Off (PTO) pay",
          description:
            "Pay you receive while taking approved time off from your job",
        },
        pension_annuity_retirement: {
          label: "Pension, Annuity or Retirement pay",
          description:
            "Different types of pay you may receive once you're retired",
        },
        severance: {
          label: "Severance pay",
          description:
            "Pay you receive from your employer when you're dismissed from your job",
        },
        vacation: {
          label: "Vacation pay",
          description: "Pay you're owed for unused vacation time",
        },
        sick: {
          label: "Sick pay",
          description: "A paid absence from your job",
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
      },
    },
    total: {
      label: "Total {{ payType }} received",
      errors: {
        required: "Total pay is required",
        min: "Total pay must be greater than 0",
      },
    },
    date_received: {
      label: "Date {{ payType }} received",
      errors: {
        required: "Date received is required",
        max: "Date must be today or in the past",
      },
    },
    note: {
      label: "Please provide further detail about {{ payType }}",
      errors: {
        required: "Please provide further detail is required",
      },
    },
  },
  is_complete: { label: "I'm done!", required: "You must check the box" },
  is_complete_description:
    "Checking this box means your claim will be sent to your workforce agency",
  validation_alert_one: "Correct the error on this page to proceed",
  validation_alert_other:
    "Correct the {{ count }} errors on this page to proceed",
};

export default claimForm;
