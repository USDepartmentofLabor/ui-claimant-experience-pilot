import isEqual from "lodash/isEqual";

// skeleton shapes with which to initialize form fields
export const ADDRESS_SKELETON: AddressType = {
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipcode: "",
};

export const EMPLOYER_SKELETON: EmployerType = {
  name: "",
  LOCAL_still_working: undefined,
  LOCAL_same_address: undefined,
  LOCAL_same_phone: undefined,
  first_work_date: "",
  address: { address1: "", city: "", state: "", zipcode: "" },
  phones: [],
  separation_reason: "",
  separation_comment: "",
};

// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
const CLAIM_FORM_SKELETON: FormValues = {
  is_complete: false,
  claimant_name: { first_name: "", middle_name: "", last_name: "" },
  claimant_has_alternate_names: undefined,
  alternate_names: [],
  email: "",
  ssn: "",
  birthdate: "",
  race: [],
  sex: undefined,
  ethnicity: undefined,
  education_level: undefined,
  LOCAL_mailing_address_same: false,
  residence_address: ADDRESS_SKELETON,
  mailing_address: ADDRESS_SKELETON,
  LOCAL_more_employers: [],
  employers: [],
} as const;

export const initializeClaimFormWithWhoAmI = (whoami: WhoAmI) => {
  const initialValues: FormValues = { ...CLAIM_FORM_SKELETON };
  // console.error("before", { whoami, initialValues });
  for (const [key, value] of Object.entries(whoami)) {
    if (key === "first_name" || key === "last_name") {
      initialValues.claimant_name[key] = value;
    } else if (value && key in initialValues && !initialValues[key]) {
      initialValues[key] = value;
    }
  }
  return initialValues;
};

export const mergeClaimFormValues = (
  initialValues: FormValues,
  partialClaim: FormValues
) => {
  // first, merge the objects
  const mergedValues = { ...initialValues, ...partialClaim };

  // second, set any of the frontend-only flow control fields to their logical starting values
  // based on what we see. This is because initialValues and partialClaim both likely
  // originated with server-side responses.
  if (partialClaim.alternate_names) {
    if (mergedValues.alternate_names?.length > 0) {
      mergedValues.claimant_has_alternate_names = "yes";
    } else {
      mergedValues.claimant_has_alternate_names = "no";
    }
  }
  if (
    mergedValues.residence_address.address1 &&
    isEqual(mergedValues.residence_address, mergedValues.mailing_address)
  ) {
    mergedValues.LOCAL_mailing_address_same = true;
  } else {
    mergedValues.LOCAL_mailing_address_same = false;
  }
  if (mergedValues.employers) {
    mergedValues.LOCAL_more_employers = [];
    mergedValues.employers.forEach((employer: EmployerType, idx: number) => {
      if (employer.last_work_date) {
        employer.LOCAL_still_working = "no";
      }
      if (employer.work_site_address) {
        employer.LOCAL_same_address = "no";
      }
      if (employer.phones && employer.phones.length > 1) {
        employer.LOCAL_same_phone = "no";
      }
      if (mergedValues.employers.length > idx + 1) {
        mergedValues.LOCAL_more_employers.push("yes");
      }
    });
    // only assume "no" for last if we have more than one already
    if (mergedValues.LOCAL_more_employers.length) {
      mergedValues.LOCAL_more_employers.push("no");
    }
  }

  return mergedValues;
};
