import { Fieldset } from "@trussworks/react-uswds";
import { TFunction, Normalize, useTranslation } from "react-i18next";
import * as yup from "yup";
import claimForm from "../../../i18n/en/claimForm";
import { RadioField } from "../../../components/form/fields/RadioField/RadioField";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import { CheckboxGroupField } from "../../../components/form/fields/CheckboxGroupField/CheckboxGroupField";
import { Alert } from "@trussworks/react-uswds";

import formStyles from "../../../components/form/form.module.scss";
import { IPageDefinition } from "../../PageDefinitions";
import { useFormikContext } from "formik";

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    sex: yup
      .mixed()
      .oneOf(Object.keys(claimForm.sex.options))
      .required(t("sex.required")),
    race: yup
      .array()
      .of(yup.mixed().oneOf(Object.keys(claimForm.race.options)))
      .min(1, t("race.required"))
      .required(t("race.required")),
    ethnicity: yup
      .mixed()
      .oneOf(Object.keys(claimForm.ethnicity.options))
      .required(t("ethnicity.required")),
    education_level: yup
      .mixed()
      .oneOf(Object.keys(claimForm.education_level.options))
      .required(t("education_level.required")),
  });

type SexOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.sex.options>;
};

const sexOptions: SexOption[] = Object.keys(claimForm.sex.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.sex.options>,
  })
);

type RaceOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.race.options>;
};

const raceOptions: RaceOption[] = Object.keys(claimForm.race.options).map(
  (option) => ({
    value: option,
    translationKey: option as Normalize<typeof claimForm.race.options>,
  })
);

type EthnicityOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.ethnicity.options>;
};

const ethnicityOptions: EthnicityOption[] = Object.keys(
  claimForm.ethnicity.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.ethnicity.options>,
}));

type EducationLevelOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.education_level.options>;
};

const educationLevelOptions: EducationLevelOption[] = Object.keys(
  claimForm.education_level.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<typeof claimForm.education_level.options>,
}));

export const DemographicInformation = () => {
  const { t } = useTranslation("claimForm");
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();

  return (
    <>
      <Alert type="info">{t("demographic_information.info_alert")}</Alert>
      <Fieldset legend={t("sex.label")} className={formStyles.field}>
        <RadioField
          id="sex"
          name="sex"
          options={sexOptions.map((option) => {
            return {
              label: t(`sex.options.${option.translationKey}`),
              value: option.value,
            };
          })}
          className="display-inline-block margin-right-7"
        />
      </Fieldset>
      <Fieldset legend={t("ethnicity.label")} className={formStyles.field}>
        <RadioField
          id="ethnicity"
          name="ethnicity"
          options={ethnicityOptions.map((option) => {
            return {
              label: t(`ethnicity.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      <Fieldset legend={t("race.label")} className={formStyles.field}>
        <CheckboxGroupField
          id="race"
          name="race"
          options={raceOptions.map((raceOption) => ({
            label: t(`race.options.${raceOption.translationKey}`),
            value: raceOption.value,
            checkboxProps: {
              onChange: (e) => {
                if (e.target.value === "opt_out" && e.target.checked) {
                  setFieldValue("race", ["opt_out"], true);
                }
              },
              disabled:
                values.race?.includes("opt_out") &&
                raceOption.value !== "opt_out",
            },
          }))}
        />
      </Fieldset>
      <DropdownField
        id="education_level"
        name="education_level"
        label={t("education_level.label")}
        startEmpty
        options={educationLevelOptions.map((option) => ({
          value: option.value,
          label: t(`education_level.options.${option.translationKey}`),
        }))}
      />
    </>
  );
};

export const DemographicInformationPage: IPageDefinition = {
  path: "demographic",
  heading: "demographic",
  initialValues: {
    sex: undefined,
    ethnicity: undefined,
    race: [],
    education_level: undefined,
  },
  Component: DemographicInformation,
  pageSchema,
};
