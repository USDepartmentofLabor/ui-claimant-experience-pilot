import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { TFunction, useTranslation } from "react-i18next";
import * as yup from "yup";

import { ClaimSchemaField } from "../../../common/YupBuilder";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { DatePicker } from "../../../components/form/fields/DatePicker/DatePicker";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import { formatUserInputDate } from "../../../utils/format";
import { IPageDefinition } from "../../PageDefinitions";

const typeOptions = [
  { label: "State Plan", value: "State Plan" },
  { label: "Private Plan", value: "Private Plan" },
  { label: "Worker's Compensation", value: "Worker's Compensation" },
];

export const DisabilityStatus = () => {
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();
  const { t } = useTranslation("claimForm");

  useEffect(() => {
    if (
      !values.disability?.recovery_date &&
      values.disability?.contacted_last_employer_after_recovery !== undefined
    ) {
      setFieldValue(
        "disability.contacted_last_employer_after_recovery",
        undefined
      );
    }
    if (values.disability?.has_collected_disability !== false) {
      return;
    }
    Object.keys(values.disability).forEach((key) => {
      const k = key as keyof typeof values.disability;
      if (
        k !== "has_collected_disability" &&
        values.disability?.[k] !== undefined
      ) {
        setFieldValue(`disability.${k}`, undefined);
      }
    });
  }, [values]);

  return (
    <Fieldset legend={t("disability.heading")}>
      <Fieldset legend={t("disability.has_collected_disability.label")}>
        <BooleanRadio
          id="disability.has_collected_disability"
          name="disability.has_collected_disability"
        />
      </Fieldset>
      {values.disability?.has_collected_disability && (
        <>
          <Fieldset legend={t("disability.disabled_immediately_before.label")}>
            <BooleanRadio
              id="disability.disabled_immediately_before"
              name="disability.disabled_immediately_before"
            />
          </Fieldset>
          <DropdownField
            id="disability.type_of_disability"
            name="disability.type_of_disability"
            label={t("disability.type_of_disability.label")}
            options={typeOptions}
            startEmpty
          />
          <DatePicker
            id="disability.date_disability_began"
            name="disability.date_disability_began"
            label={t("disability.date_disability_began.label")}
            defaultValue={values.disability.date_disability_began}
            maxDate={
              values.disability.recovery_date ||
              formatUserInputDate(new Date().toISOString())
            }
            onChange={(val: string | undefined) => {
              setFieldValue(
                "disability.date_disability_began",
                formatUserInputDate(val),
                true
              );
            }}
          />
          <DatePicker
            id="disability.recovery_date"
            name="disability.recovery_date"
            label={t("disability.recovery_date.label")}
            defaultValue={values.disability.recovery_date}
            minDate={values.disability.date_disability_began || undefined}
            maxDate={new Date().toISOString().split("T")[0]}
            onChange={(val: string | undefined) => {
              setFieldValue(
                "disability.recovery_date",
                formatUserInputDate(val),
                true
              );
            }}
          />
          {values.disability.recovery_date && (
            <Fieldset
              legend={t("disability.contact_employer_after_recovering.label")}
            >
              <BooleanRadio
                id="disability.contacted_last_employer_after_recovery"
                name="disability.contacted_last_employer_after_recovery"
              />
            </Fieldset>
          )}
        </>
      )}
    </Fieldset>
  );
};

const schemaFields: ClaimSchemaField[] = ["disability"];

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object({
    disability: yup.object({
      has_collected_disability: yup
        .boolean()
        .required(t("disability.has_collected_disability.required")),
      disabled_immediately_before: yup
        .boolean()
        .when("has_collected_disability", {
          is: true,
          then: yup.boolean().required(),
        }),
      date_disability_began: yup
        .date()
        .max(new Date())
        .when("has_collected_disability", {
          is: true,
          then: yup.date().required(),
        }),
      recovery_date: yup
        .date()
        .max(new Date())
        .when("date_disability_began", {
          is: (date: string | undefined) => !!date,
          then: yup.date().min(yup.ref("date_disability_began")),
        }),
      type_of_disability: yup
        .mixed()
        .oneOf(typeOptions.map(({ value }) => value))
        .when("has_collected_disability", {
          is: true,
          then: yup.mixed().required(),
        }),
      contacted_last_employer_after_recovery: yup
        .boolean()
        .when("recovery_date", {
          is: (val: string | undefined) => !!val,
          then: yup.boolean().required(),
        }),
    }),
  });

export const DisabilityStatusPage: IPageDefinition = {
  path: "disability-status",
  heading: "disability",
  schemaFields: schemaFields,
  initialValues: { disability: {} },
  Component: DisabilityStatus,
  pageSchema,
};
