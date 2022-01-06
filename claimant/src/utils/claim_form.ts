import isEqual from "lodash/isEqual";
import { IPageDefinition } from "../pages/PageDefinitions";

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
  email: "",
  ssn: "",
};

export const getInitialValuesFromPageDefinitions = (
  pages: ReadonlyArray<IPageDefinition>
) =>
  pages
    .flatMap((page) => page.initialValues)
    .reduce((previousValue, currentValue) => ({
      ...previousValue,
      ...currentValue,
    }));

export const initializeClaimFormWithWhoAmI = (
  emptyInitialValues: FormValues,
  whoami: WhoAmI
) => {
  const initializedValues: FormValues = {
    ...CLAIM_FORM_SKELETON, // TODO: CLAIM_FORM_SKELETON should be removed entirely when email and ssn are incorporated into a component
    ...emptyInitialValues, //   At that point, we can use emptyInitialValues directly
  };
  for (const [key, value] of Object.entries(whoami)) {
    if (key === "first_name" || key === "last_name") {
      initializedValues.claimant_name[key] = value;
    } else if (value && key in initializedValues && !initializedValues[key]) {
      initializedValues[key] = value;
    }
  }
  return initializedValues;
};

export const mergeClaimFormValues = (
  initialValues: FormValues,
  partialClaim: FormValues
) => {
  // first, merge the objects
  const mergedValues = { ...initialValues, ...partialClaim };

  // second, set any of the LOCAL_ flow control fields to their logical starting values
  // based on what we see. This is because initialValues and partialClaim both likely
  // originated with server-side responses.
  if (
    partialClaim.alternate_names &&
    !mergedValues.LOCAL_claimant_has_alternate_names
  ) {
    if (mergedValues.alternate_names?.length > 0) {
      mergedValues.LOCAL_claimant_has_alternate_names = "yes";
    } else {
      mergedValues.LOCAL_claimant_has_alternate_names = "no";
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
    if (!mergedValues.LOCAL_more_employers) {
      mergedValues.LOCAL_more_employers = [];
    }
    mergedValues.employers.forEach((employer: EmployerType, idx: number) => {
      if (!employer.LOCAL_still_working) {
        if (employer.last_work_date) {
          employer.LOCAL_still_working = "no";
        } else {
          employer.LOCAL_still_working = "yes";
        }
      }
      if (!employer.LOCAL_same_address) {
        if (employer.work_site_address) {
          employer.LOCAL_same_address = "no";
        } else {
          employer.LOCAL_same_address = "yes";
        }
      }
      if (
        !employer.LOCAL_same_phone &&
        employer.phones &&
        employer.phones.length > 1
      ) {
        employer.LOCAL_same_phone = "no";
      }
      if (
        mergedValues.LOCAL_more_employers.length <
          mergedValues.employers.length &&
        mergedValues.employers.length > idx + 1
      ) {
        mergedValues.LOCAL_more_employers.push("yes");
      }
    });
    // only assume "no" for last if we have more than one already
    if (
      mergedValues.LOCAL_more_employers.length < mergedValues.employers.length
    ) {
      mergedValues.LOCAL_more_employers.push("no");
    }
  }

  return mergedValues;
};
