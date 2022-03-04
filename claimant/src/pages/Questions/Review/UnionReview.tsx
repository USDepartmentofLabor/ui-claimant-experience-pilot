import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { UnionPage } from "../Union/Union";
import { YesNoReview } from "./ReviewHelpers";

export const UnionReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "union" });
  const {
    values: { union },
  } = useFormikContext<UnionType>();

  return (
    <ReviewSection pageDefinition={UnionPage}>
      <YesNoReview
        title={t("is_union_member.label")}
        value={union?.is_union_member}
      />
      {union?.union_name && (
        <ReviewElement title={t("union_name.label")} text={union.union_name} />
      )}
      {union?.union_local_number && (
        <ReviewElement
          title={t("union_local_number.label")}
          text={union.union_local_number}
        />
      )}
      <YesNoReview
        title={t("required_to_seek_work_through_hiring_hall.label")}
        value={union?.required_to_seek_work_through_hiring_hall}
      />
    </ReviewSection>
  );
};
