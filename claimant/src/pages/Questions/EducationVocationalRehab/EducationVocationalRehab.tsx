import { Fieldset } from "@trussworks/react-uswds";
import { useTranslation } from "react-i18next";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { IPageDefinition } from "../../PageDefinitions";

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

const schemaFields: ClaimSchemaField[] = [
  "student_fulltime_in_last_18_months",
  "attending_college_or_job_training",
  "registered_with_vocational_rehab",
];

export const EducationVocationalRehabPage: IPageDefinition = {
  path: "education-vocational-rehab",
  schemaFields: schemaFields,
  initialValues: {},
  Component: EducationVocationalRehab,
};
