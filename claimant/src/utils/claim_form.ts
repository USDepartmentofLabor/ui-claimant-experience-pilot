// skeleton shapes with which to initialize form fields
export const ADDRESS_SKELETON: AddressType = {
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipcode: "",
};

// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
const CLAIM_FORM_SKELETON: FormValues = {
  is_complete: false,
  claimant_name: { first_name: "", middle_name: "", last_name: "" },
  claimant_has_alternate_names: undefined,
  alternate_names: [],
  LOCAL_mailing_address_same: false,
  residence_address: ADDRESS_SKELETON,
  mailing_address: ADDRESS_SKELETON,
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
