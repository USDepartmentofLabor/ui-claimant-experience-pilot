import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { DatePicker } from "../../../components/form/fields/DatePicker/DatePicker";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import { formatUserInputDate } from "../../../utils/format";
import { IPageDefinition } from "../../PageDefinitions";

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
            options={[
              { label: "State Plan", value: "State Plan" },
              { label: "Private Plan", value: "Private Plan" },
              {
                label: "Worker's Compensation",
                value: "Worker's Compensation",
              },
            ]}
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

export const DisabilityStatusPage: IPageDefinition = {
  path: "disability-status",
  heading: "disability",
  schemaFields: schemaFields,
  initialValues: { disability: {} },
  Component: DisabilityStatus,
};
