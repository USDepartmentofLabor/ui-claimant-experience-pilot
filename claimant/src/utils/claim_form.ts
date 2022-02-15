import isEqual from "lodash/isEqual";
import { IPageDefinition } from "../pages/PageDefinitions";

// skeleton shapes with which to initialize form fields
export const PERSON_NAME_SKELETON: PersonName = {
  first_name: "",
  middle_name: "",
  last_name: "",
};

export const PHONE_SKELETON: PhoneType = {
  number: "",
};

export const ADDRESS_SKELETON: AddressType = {
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipcode: "",
};

export const EMPLOYER_SKELETON: EmployerType = {
  name: "",
  first_work_date: "",
  address: { ...ADDRESS_SKELETON },
  work_site_address: undefined,
  LOCAL_same_address: undefined,
  phones: [{ number: "" }],
  LOCAL_same_phone: undefined,
  separation_reason: "",
  separation_comment: "",
  fein: "",
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
  const initializedValues: FormValues = { ...emptyInitialValues };
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

  // some whoami values always take precedence
  if (initialValues.ssn) {
    mergedValues.ssn = initialValues.ssn;
  }
  if (initialValues.birthdate) {
    mergedValues.birthdate = initialValues.birthdate;
  }

  // second, set any of the LOCAL_ flow control fields to their logical starting values
  // based on what we see. This is because initialValues and partialClaim both likely
  // originated with server-side responses.
  if (
    partialClaim.alternate_names &&
    !mergedValues.LOCAL_claimant_has_alternate_names
  ) {
    if (mergedValues.alternate_names?.length > 0) {
      mergedValues.LOCAL_claimant_has_alternate_names = true;
    } else {
      mergedValues.LOCAL_claimant_has_alternate_names = false;
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
      if (!employer.LOCAL_same_address) {
        if (employer.work_site_address) {
          employer.LOCAL_same_address = false;
        } else {
          employer.LOCAL_same_address = true;
        }
      }
      if (
        !employer.LOCAL_same_phone &&
        employer.phones &&
        employer.phones.length > 1
      ) {
        employer.LOCAL_same_phone = false;
      }
      if (
        mergedValues.LOCAL_more_employers.length <
          mergedValues.employers.length &&
        mergedValues.employers.length > idx + 1
      ) {
        mergedValues.LOCAL_more_employers.push(true);
      }
    });
    // only assume "no" for last if we have more than one already
    if (
      mergedValues.LOCAL_more_employers.length < mergedValues.employers.length
    ) {
      mergedValues.LOCAL_more_employers.push(false);
    }
  }

  return mergedValues;
};
