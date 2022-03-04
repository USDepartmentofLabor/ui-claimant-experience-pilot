import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { DisabilityStatusPage } from "../DisabilityStatus/DisabilityStatus";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { YesNoReview } from "./ReviewHelpers";

export const DisabilityStatusReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "disability" });
  const {
    values: { disability },
  } = useFormikContext<DisabilityStatusType>();

  return (
    <ReviewSection pageDefinition={DisabilityStatusPage}>
      <YesNoReview
        title={t("has_collected_disability.label")}
        value={disability?.has_collected_disability}
      />
      {disability?.disabled_immediately_before !== undefined && (
        <YesNoReview
          title={t("disabled_immediately_before.label")}
          value={disability.disabled_immediately_before}
        />
      )}
      {disability?.type_of_disability && (
        <ReviewElement
          title={t("type_of_disability.label")}
          text={t(
            `type_of_disability.options.${disability.type_of_disability}`
          )}
        />
      )}
      {disability?.date_disability_began && (
        <ReviewElement
          title={t("date_disability_began.label")}
          text={disability.date_disability_began}
        />
      )}
      {disability?.recovery_date && (
        <ReviewElement
          title={t("recovery_date.label")}
          text={disability.recovery_date}
        />
      )}
      {disability?.contacted_last_employer_after_recovery !== undefined && (
        <YesNoReview
          title={t("contact_employer_after_recovering.label")}
          value={disability.contacted_last_employer_after_recovery}
        />
      )}
    </ReviewSection>
  );
};
