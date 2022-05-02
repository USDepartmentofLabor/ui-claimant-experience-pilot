import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { TFunction, useTranslation } from "react-i18next";
import * as yup from "yup";

import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import { DatePicker } from "../../../components/form/fields/DatePicker/DatePicker";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import { formatUserInputDate } from "../../../utils/format";
import { IPageDefinition } from "../../PageDefinitions";
import HelpText from "../../../components/HelpText/HelpText";

const typeOptions = [
  { label: "State Plan", value: "state_plan" },
  { label: "Private Plan", value: "private_plan" },
  { label: "Worker's Compensation", value: "workers_compensation" },
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
      <YesNoQuestion
        question={t("disability.has_collected_disability.label")}
        id="disability.has_collected_disability"
        name="disability.has_collected_disability"
      >
        <HelpText withLeftBorder={true}>
          {t("disability.has_collected_disability.help_text")}
        </HelpText>
      </YesNoQuestion>
      {values.disability?.has_collected_disability && (
        <>
          <YesNoQuestion
            question={t("disability.disabled_immediately_before.label")}
            id="disability.disabled_immediately_before"
            name="disability.disabled_immediately_before"
          />
          <DropdownField
            name="disability.type_of_disability"
            label={t("disability.type_of_disability.label")}
            options={typeOptions}
            startEmpty
          />
          <DatePicker
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
            <YesNoQuestion
              question={t("disability.contact_employer_after_recovering.label")}
              id="disability.contacted_last_employer_after_recovery"
              name="disability.contacted_last_employer_after_recovery"
            />
          )}
        </>
      )}
    </Fieldset>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    disability: yup.object().shape({
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
  initialValues: { disability: {} },
  Component: DisabilityStatus,
  pageSchema,
};
