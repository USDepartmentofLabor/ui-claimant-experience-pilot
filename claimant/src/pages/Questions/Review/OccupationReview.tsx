import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { OccupationPage } from "../Occupation/Occupation";

export const OccupationReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "occupation" });
  const { values } = useFormikContext<OccupationType>();

  return (
    <ReviewSection pageDefinition={OccupationPage}>
      {values.occupation?.job_title && (
        <ReviewElement
          title={t("what_is_your_occupation.label")}
          text={values.occupation.job_title}
        />
      )}
      {values.occupation?.job_description && (
        <ReviewElement
          title={t("short_description.label")}
          text={values.occupation.job_description}
        />
      )}
    </ReviewSection>
  );
};
