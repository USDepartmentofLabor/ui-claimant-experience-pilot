// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
const CLAIM_FORM_SKELETON: FormValues = {
  is_complete: false,
  claimant_name: { first_name: "", middle_name: "", last_name: "" },
  claimant_has_alternate_names: undefined,
  alternate_names: [],
  email: "",
  birthdate: "",
  ssn: "",
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
