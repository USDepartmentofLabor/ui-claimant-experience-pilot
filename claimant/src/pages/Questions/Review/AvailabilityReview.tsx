import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { AvailabilityPage } from "../Availability/Availability";
import { YesNoReview } from "./ReviewHelpers";

export const AvailabilityReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "availability" });
  const { t: tCommon } = useTranslation("common");
  const {
    values: { availability },
  } = useFormikContext<AvailabilityType>();

  return (
    <ReviewSection pageDefinition={AvailabilityPage}>
      <YesNoReview
        title={t("can_begin_work_immediately.label")}
        value={availability?.can_begin_work_immediately}
      />
      {availability?.cannot_begin_work_immediately_reason && (
        <ReviewElement
          title={tCommon("provide_more_information")}
          text={availability.cannot_begin_work_immediately_reason}
        />
      )}
      <YesNoReview
        title={t("can_work_full_time.label")}
        value={availability?.can_work_full_time}
      />
      {availability?.cannot_work_full_time_reason && (
        <ReviewElement
          title={tCommon("provide_more_information")}
          text={availability.cannot_work_full_time_reason}
        />
      )}
      <YesNoReview
        title={t("is_prevented_from_accepting_full_time_work.label")}
        value={availability?.is_prevented_from_accepting_full_time_work}
      />
      {availability?.is_prevented_from_accepting_full_time_work_reason && (
        <ReviewElement
          title={tCommon("provide_more_information")}
          text={availability.is_prevented_from_accepting_full_time_work_reason}
        />
      )}
    </ReviewSection>
  );
};
