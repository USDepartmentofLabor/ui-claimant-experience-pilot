import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { YesNoReview } from "./ReviewHelpers";
import { EducationVocationalRehabPage } from "../EducationVocationalRehab/EducationVocationalRehab";

export const EducationVocationRehabReview = () => {
  const { t } = useTranslation("claimForm");
  const { values } = useFormikContext<EducationVocationalRehabType>();

  return (
    <ReviewSection pageDefinition={EducationVocationalRehabPage}>
      <YesNoReview
        title={t(
          "education_vocational_rehab.education.attending_training.label"
        )}
        value={values.attending_college_or_job_training}
      />
      {values.type_of_college_or_job_training && (
        <ReviewElement
          title={t("education_vocational_rehab.education.training_type.label")}
          text={t(
            `education_vocational_rehab.education.training_type.options.${values.type_of_college_or_job_training}`
          )}
        />
      )}
      {values.education_level && (
        <ReviewElement
          title={t("education_level.label")}
          text={t(`education_level.options.${values.education_level}`)}
        />
      )}
      <YesNoReview
        title={t(
          "education_vocational_rehab.vocational_rehab.is_registered.label"
        )}
        value={values.registered_with_vocational_rehab}
      />
    </ReviewSection>
  );
};
