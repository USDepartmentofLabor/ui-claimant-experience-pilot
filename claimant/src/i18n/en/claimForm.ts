// IMPORTANT that the key names and nested structure is consistent with our claim schema
// so that YupBuilder can accurately pull out the 'errors' messages.
const claimForm = {
  birthdate: {
    label: "Date of birth",
  },
  sex: {
    label: "Sex",
    options: {
      female: "Female",
      male: "Male",
    },
    errors: {
      required: "Sex is a required field",
    },
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
    errors: {
      required: "Race is a required field",
    },
  },
  ethnicity: {
    label: "Do you identify as Hispanic or Latino?",
    options: {
      opt_out: "Choose not to answer",
      hispanic: "Yes",
      not_hispanic: "No",
    },
    errors: {
      required: "Ethnicity is a required field",
    },
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
    errors: {
      required: "At least one education level must be selected",
    },
  },
  employers: {
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
    },
    more_employers: {
      label:
        "Have you worked for any other employers in the last 18 months (including part-time, seasonal, and self-employment)?",
    },
    first_work_date: {
      label: "Start date for this employer:",
    },
    last_work_date: {
      label: "Last day of work for this employer:",
    },
    still_working: {
      label: "Are you still working for this employer?",
    },
    same_phone: {
      label: "Is this the phone number of the location where you worked?",
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
  occupation: {
    search: "Search",
    choose_the_occupation:
      "Choose the occupation that best matches your selection above. If nothing matches, please try another search.",
    heading: "Your occupation",
    what_is_your_occupation: { label: "What is your occupation?" },
    hint: "If you're not sure, see our",
    list_of_occupations: "list of occupations",
    short_description: { label: "Short description of your job" },
    no_results: "", // TODO?
    opens_in_a_new_tab: "opens in a new tab",
  },
};

export default claimForm;
