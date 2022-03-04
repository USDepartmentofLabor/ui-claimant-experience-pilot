import { Normalize, useTranslation } from "react-i18next";
import { CustomReviewSection, ReviewElement } from "./ReviewSection";
import { addressToString } from "../../../utils/format";
import { YesNoReview } from "./ReviewHelpers";
import claimForm from "../../../i18n/en/claimForm";
import { separationReasons } from "../../../components/form/SeparationReason/SeparationReason";
import { useFormikContext } from "formik";

const EmployerReview = ({ employer }: { employer: EmployerType }) => {
  const { t } = useTranslation("claimForm", { keyPrefix: "employers" });

  return (
    <>
      <ReviewElement title={t("name.label")} text={employer.name} />
      {employer.address && (
        <ReviewElement
          title={t("address.heading")}
          text={addressToString(employer.address)}
        />
      )}
      <YesNoReview
        title={t("same_address.label")}
        value={employer.LOCAL_same_address}
      />
      {employer.work_site_address && (
        <ReviewElement
          title={t("work_site_address.heading")}
          text={addressToString(employer.work_site_address)}
        />
      )}
      {employer.phones?.[0] && (
        <ReviewElement
          title={t("phones.number.label")}
          text={employer.phones[0].number}
        />
      )}
      <YesNoReview
        title={t("same_phone.label")}
        value={employer.LOCAL_same_phone}
      />
      {employer.phones &&
        employer.phones.length > 1 &&
        employer.phones
          .slice(1)
          .map((phone) => (
            <ReviewElement
              title={t("alt_employer_phone")}
              text={phone.number}
              key={phone.number}
            />
          ))}
      {employer.fein && (
        <ReviewElement title={t("fein.label")} text={employer.fein} />
      )}
      {employer.separation_reason && (
        <ReviewElement
          title={t("separation.reason.label")}
          text={t(`separation.reasons.${employer.separation_reason}.label`)}
        />
      )}
      {employer.separation_reason && employer.separation_option && (
        <ReviewElement
          title={
            t(
              `separation.reasons.${employer.separation_reason}.option_heading`
            ) as string
          }
          text={
            t(
              `separation.reasons.${employer.separation_reason}.options.${employer.separation_option}` as Normalize<
                typeof claimForm.employers
              >
            ) as string
          }
        />
      )}
      {employer.separation_reason && employer.separation_comment && (
        <ReviewElement
          title={t(
            separationReasons.get(employer.separation_reason)?.comment_required
              ? "separation.comment.required_label"
              : "separation.comment.optional_label"
          )}
          text={employer.separation_comment}
        />
      )}
      {employer.first_work_date && (
        <ReviewElement
          title={t("first_work_date.label")}
          text={employer.first_work_date}
        />
      )}
      {employer.last_work_date && (
        <ReviewElement
          title={t("last_work_date.label")}
          text={employer.last_work_date}
        />
      )}
    </>
  );
};

export const EmployersReview = () => {
  const { values } = useFormikContext<Claim>();

  return (
    <>
      {values.employers &&
        values.employers.map((employer, idx) => (
          <CustomReviewSection
            key={employer.name}
            path={`employer/${idx}`}
            heading={employer.name}
          >
            <EmployerReview employer={employer} />
          </CustomReviewSection>
        ))}
    </>
  );
};
