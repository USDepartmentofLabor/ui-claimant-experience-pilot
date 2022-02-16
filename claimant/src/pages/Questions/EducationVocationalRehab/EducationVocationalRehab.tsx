import { Fieldset } from "@trussworks/react-uswds";
import { Normalize, TFunction, useTranslation } from "react-i18next";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";
import DropdownField from "../../../components/form/fields/DropdownField/DropdownField";
import claimForm from "../../../i18n/en/claimForm";

export const EducationVocationalRehab = () => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <Fieldset legend={t("education_vocational_rehab.education.heading")}>
        <YesNoQuestion
          question={t(
            "education_vocational_rehab.education.full_time_student.label"
          )}
          id="student_fulltime_in_last_18_months"
          name="student_fulltime_in_last_18_months"
        />
        <YesNoQuestion
          question={t(
            "education_vocational_rehab.education.attending_training.label"
          )}
          id="attending_college_or_job_training"
          name="attending_college_or_job_training"
        />
        <DropdownField
          id="education_level"
          name="education_level"
          label={t("education_level.label")}
          startEmpty
          options={Object.keys(claimForm.education_level.options).map(
            (option) => ({
              value: option,
              label: t(
                `education_level.options.${
                  option as Normalize<typeof claimForm.education_level.options>
                }`
              ),
            })
          )}
        />
      </Fieldset>
      <Fieldset
        legend={t("education_vocational_rehab.vocational_rehab.heading")}
      >
        <YesNoQuestion
          question={t(
            "education_vocational_rehab.vocational_rehab.is_registered.label"
          )}
          id="registered_with_vocational_rehab"
          name="registered_with_vocational_rehab"
        />
      </Fieldset>
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    student_fulltime_in_last_18_months: yup
      .boolean()
      .required(
        t("education_vocational_rehab.education.full_time_student.required")
      ),
    attending_college_or_job_training: yup
      .boolean()
      .required(
        t("education_vocational_rehab.education.attending_training.required")
      ),
    education_level: yup
      .mixed()
      .oneOf(Object.keys(claimForm.education_level.options))
      .required(t("education_level.required")),
    registered_with_vocational_rehab: yup
      .boolean()
      .required(
        t("education_vocational_rehab.vocational_rehab.is_registered.required")
      ),
  });

export const EducationVocationalRehabPage: IPageDefinition = {
  path: "education-vocational-rehab",
  heading: "education_vocational_rehab",
  initialValues: {},
  Component: EducationVocationalRehab,
  pageSchema,
};
