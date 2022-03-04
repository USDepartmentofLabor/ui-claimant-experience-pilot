import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { YesNoReview } from "./ReviewHelpers";
import { SelfEmploymentPage } from "../SelfEmployment/SelfEmployment";

export const SelfEmploymentReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "self_employment" });
  const { values } = useFormikContext<SelfEmploymentType>();

  return (
    <ReviewSection pageDefinition={SelfEmploymentPage}>
      <YesNoReview
        title={t("self_employed.label")}
        value={values.self_employment?.is_self_employed}
      />
      <YesNoReview
        title={t("business_ownership.label")}
        value={values.self_employment?.ownership_in_business}
      />
      {values.self_employment?.name_of_business && (
        <ReviewElement
          title={t("business_name.label")}
          text={values.self_employment.name_of_business}
        />
      )}
      <YesNoReview
        title={t("corporate_officer.label")}
        value={values.self_employment?.is_corporate_officer}
      />
      {values.self_employment?.name_of_corporation && (
        <ReviewElement
          title={t("corporation_name.label")}
          text={values.self_employment.name_of_corporation}
        />
      )}
      <YesNoReview
        title={t("related_to_owner.label")}
        value={values.self_employment?.related_to_owner}
      />
      <YesNoReview
        title={t("corporation_or_partnership.label")}
        value={values.self_employment?.corporation_or_partnership}
      />
    </ReviewSection>
  );
};
