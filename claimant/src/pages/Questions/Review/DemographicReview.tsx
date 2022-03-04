import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { DemographicPage } from "../Demographic/Demographic";

export const DemographicInformationReview = () => {
  const { t } = useTranslation("claimForm");
  const { values } = useFormikContext<Claim>();
  return (
    <ReviewSection pageDefinition={DemographicPage}>
      {values.sex && (
        <ReviewElement
          title={t("sex.label")}
          text={t(`sex.options.${values.sex}`)}
        />
      )}
      {values.ethnicity && (
        <ReviewElement
          title={t("ethnicity.label")}
          text={t(`ethnicity.options.${values.ethnicity}`)}
        />
      )}
      {values.race && values.race.length > 0 && (
        <ReviewElement
          title={t("race.label")}
          text={values.race.map((race) => t(`race.options.${race}`)).join(", ")}
        />
      )}
    </ReviewSection>
  );
};
