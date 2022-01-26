import { useEffect } from "react";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField/TextField";
import { BooleanRadio } from "../BooleanRadio/BooleanRadio";
import { DatePicker } from "../fields/DatePicker/DatePicker";
import Address from "../Address/Address";
import { SeparationReason } from "../SeparationReason/SeparationReason";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";
import { formatUserInputDate } from "../../../utils/format";

interface IEmployerProfileProps {
  segment: string;
}

export const EmployerProfile = ({ segment }: IEmployerProfileProps) => {
  const { t } = useTranslation("claimForm", { keyPrefix: "employers" });
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();

  const segmentIdx = parseInt(segment);
  const segmentExists = !!values.employers?.[segmentIdx];

  useEffect(() => {
    if (!segmentExists) {
      const employers = [...(values.employers || [])];
      employers[segmentIdx] = { ...EMPLOYER_SKELETON };
      setFieldValue("employers", employers);
      setFieldValue(
        "LOCAL_more_employers",
        values.LOCAL_more_employers
          ? [...values.LOCAL_more_employers, undefined]
          : [undefined]
      );
    }
  }, [segmentExists]);

  // Let the effect hook populate values if necessary
  if (!values.employers || !segmentExists) {
    return null;
  }
  const employer = values.employers[segmentIdx];

  return (
    <>
      <h3>{t("heading")}</h3>
      <TextField
        name={`employers[${segment}].name`}
        label={t("name.label")}
        type="text"
        id={`employers[${segment}].name`}
        hint={t("name.hint")}
      />
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
        <BooleanRadio
          id={`employers[${segment}].LOCAL_same_address`}
          name={`employers[${segment}].LOCAL_same_address`}
          noLabel={t("no_different_address")}
        />
      </Fieldset>
      {employer.LOCAL_same_address === false && (
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
      <TextField
        name={`employers[${segment}].phones[0].number`}
        label={t("phones.number.label")}
        type="tel"
        id={`employers[${segment}].phones[0].number`}
      />
      <Fieldset legend={t("same_phone.label")}>
        <BooleanRadio
          id={`employers[${segment}].LOCAL_same_phone`}
          name={`employers[${segment}].LOCAL_same_phone`}
          noLabel={t("no_different_phone")}
        />
      </Fieldset>
      {employer.LOCAL_same_phone === false && (
        <TextField
          name={`employers[${segment}].phones[1].number`}
          label={t("alt_employer_phone")}
          type="tel"
          id={`employers[${segment}].phones[1].number`}
        />
      )}
      <TextField
        name={`employers[${segment}].fein`}
        label={t("fein.label")}
        type="text"
        id={`employers[${segment}].fein`}
        hint={t("fein.hint")}
      />
      <SeparationReason segment={segment} />
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
      {employer.separation_reason &&
        employer.separation_reason !== "still_employed" && (
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
    </>
  );
};
