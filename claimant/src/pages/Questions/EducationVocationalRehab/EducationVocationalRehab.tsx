import { Fieldset } from "@trussworks/react-uswds";
import { TFunction, useTranslation } from "react-i18next";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";

export const EducationVocationalRehab = () => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <Fieldset legend={t("education_vocational_rehab.education.heading")}>
        <Fieldset
          legend={t(
            "education_vocational_rehab.education.full_time_student.label"
          )}
        >
          <BooleanRadio
            id="student_fulltime_in_last_18_months"
            name="student_fulltime_in_last_18_months"
          />
        </Fieldset>
        <Fieldset
          legend={t(
            "education_vocational_rehab.education.attending_training.label"
          )}
        >
          <BooleanRadio
            id="attending_college_or_job_training"
            name="attending_college_or_job_training"
          />
        </Fieldset>
      </Fieldset>
      <Fieldset
        legend={t("education_vocational_rehab.vocational_rehab.heading")}
      >
        <Fieldset
          legend={t(
            "education_vocational_rehab.vocational_rehab.is_registered.label"
          )}
        >
          <BooleanRadio
            id="registered_with_vocational_rehab"
            name="registered_with_vocational_rehab"
          />
        </Fieldset>
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
