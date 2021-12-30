import { useEffect } from "react";
import { ErrorMessage, FormGroup, Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import * as yup from "yup";
import i18next from "i18next";
import TextField from "../fields/TextField/TextField";
import { YesNoRadio } from "../YesNoRadio/YesNoRadio";
import { DatePicker } from "../fields/DatePicker/DatePicker";
import Address from "../Address/Address";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";

import dayjs from "dayjs";

const formatUserInputDate = (initialValue?: string): string | undefined => {
  const dayjsValue = dayjs(initialValue);
  return initialValue && dayjsValue.isValid()
    ? dayjsValue.format("YYYY-MM-DD")
    : initialValue; // preserve undefined to show validations later
};

interface IEmployerProfileProps {
  segment: string;
}

// TODO how to implement these per employer when our schema-fed yup validation
// operated on an array (employers=[])
const local_validations = {
  LOCAL_same_phone: yup.string().required(i18next.t("validation.required")),
  LOCAL_same_address: yup.string().required(i18next.t("validation.required")),
};

export const EmployerProfile = ({ segment }: IEmployerProfileProps) => {
  const { t } = useTranslation("claimForm", { keyPrefix: "employers" });
  const { values, errors, touched, setFieldValue } =
    useFormikContext<ClaimantInput>();

  const segmentIdx = parseInt(segment);
  const segmentExists = !!values.employers?.[segmentIdx];

  useEffect(() => {
    if (!segmentExists) {
      const employers = [...(values.employers || [])];
      employers[segmentIdx] = { ...EMPLOYER_SKELETON };
      setFieldValue("employers", employers);
    }
  }, [segmentExists]);

  // Let the effect hook populate values if necessary
  if (!segmentExists || !values.employers) {
    return <></>;
  }
  const employer = values.employers[segmentIdx];
  const employerErrors =
    errors && errors.employers && errors.employers[segmentIdx]
      ? errors.employers[segmentIdx]
      : {};
  // const touchedEmployer = (touched.employers && touched.employers[segmentIdx]) ? touched.employers[segmentIdx] : {};

  // TODO we want these error states conditional on whether the field is "touched" or not
  // so that the errors don't show up until Next is clicked
  const showPhonesError = "phones" in employerErrors;
  const showStillWorkingError = employer.LOCAL_still_working === undefined;
  const showSameAddressError = employer.LOCAL_same_address === undefined;
  const showSamePhoneError = employer.LOCAL_same_phone === undefined;

  console.log({
    values,
    employer,
    touched,
    errors,
    employerErrors,
    local_validations,
    // touchedEmployer,
  });

  return (
    <>
      <h3>{t("heading")}</h3>
      <TextField
        name={`employers[${segment}].name`}
        label={t("name.label")}
        type="text"
        id={`employers[${segment}].name`}
      />
      <Fieldset legend={t("still_working.label")}>
        <FormGroup error={showStillWorkingError}>
          <YesNoRadio
            id={`employers[${segment}].LOCAL_still_working`}
            name={`employers[${segment}].LOCAL_still_working`}
          />
        </FormGroup>
        {showStillWorkingError && (
          <ErrorMessage>{t("errors.required")}</ErrorMessage>
        )}
      </Fieldset>
      <DatePicker
        label={t("first_work_date.label")}
        id={`employers[${segment}].first_work_date`}
        name={`employers[${segment}].first_work_date`}
        defaultValue={employer.first_work_date}
        onChange={(val: string | undefined) => {
          setFieldValue(
            `employers[${segment}].first_work_date`,
            formatUserInputDate(val),
            true
          );
        }}
      />
      {employer.LOCAL_still_working === "no" && (
        <DatePicker
          label={t("last_work_date.label")}
          id={`employers[${segment}].last_work_date`}
          name={`employers[${segment}].last_work_date`}
          defaultValue={employer.last_work_date}
          onChange={(val: string | undefined) => {
            setFieldValue(
              `employers[${segment}].last_work_date`,
              formatUserInputDate(val)
            );
          }}
        />
      )}
      <Address
        labels={{
          address1: t("address.address1.label"),
          address2: t("address.address2.label"),
          city: t("address.city.label"),
          state: t("address.state.label"),
          zipcode: t("address.zipcode.label"),
        }}
        basename={`employers[${segment}].address`}
      />
      <Fieldset legend={t("same_address.label")}>
        <FormGroup error={showSameAddressError}>
          <YesNoRadio
            id={`employers[${segment}].LOCAL_same_address`}
            name={`employers[${segment}].LOCAL_same_address`}
            noLabel={t("no_different_address")}
          />
        </FormGroup>
        {showSameAddressError && (
          <ErrorMessage>{t("errors.required")}</ErrorMessage>
        )}
      </Fieldset>
      {employer.LOCAL_same_address === "no" && (
        <Fieldset legend={t("work_site_address.heading")}>
          <Address
            labels={{
              address1: t("work_site_address.address1.label"),
              address2: t("work_site_address.address2.label"),
              city: t("work_site_address.city.label"),
              state: t("work_site_address.state.label"),
              zipcode: t("work_site_address.zipcode.label"),
            }}
            basename={`employers[${segment}].work_site_address`}
          />
        </Fieldset>
      )}
      <FormGroup error={showPhonesError}>
        <TextField
          name={`employers[${segment}].phones[0].number`}
          label={t("phones.number.label")}
          type="text"
          id={`employers[${segment}].phones[0].number`}
        />
      </FormGroup>
      {showPhonesError && (
        <ErrorMessage>{t("phones.number.errors.required")}</ErrorMessage>
      )}
      <Fieldset legend={t("same_phone.label")}>
        <FormGroup error={showSamePhoneError}>
          <YesNoRadio
            id={`employers[${segment}].LOCAL_same_phone`}
            name={`employers[${segment}].LOCAL_same_phone`}
            noLabel={t("no_different_phone")}
          />
        </FormGroup>
        {showSamePhoneError && (
          <ErrorMessage>{t("errors.required")}</ErrorMessage>
        )}
      </Fieldset>
      {employer.LOCAL_same_phone === "no" && (
        <TextField
          name={`employers[${segment}].phones[1].number`}
          label={t("alt_employer_phone")}
          type="text"
          id={`employers[${segment}].phones[1].number`}
        />
      )}
      <FormGroup>
        <TextField
          name={`employers[${segment}].fein`}
          label={t("fein.label")}
          type="text"
          id={`employers[${segment}].fein`}
        />
        <div className="usa-hint" id={`employers[${segment}].fein-hint`}>
          {t("fein.hint")}
        </div>
      </FormGroup>
    </>
  );
};
