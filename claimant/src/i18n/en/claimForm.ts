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
      hawaiian_or_pacific_islander: "Native Hawaiian or Other Pacific Islander",
      asian: "Asian",
      american_indian_or_alaskan: "American Indian or Alaska Native",
      black: "Black or African American",
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
};

export default claimForm;
