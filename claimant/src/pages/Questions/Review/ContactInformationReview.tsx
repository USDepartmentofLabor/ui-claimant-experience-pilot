import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { PhoneReview, YesNoReview } from "./ReviewHelpers";
import { ContactInformationPage } from "../ContactInformation/ContactInformation";

export const ContactInformationReview = () => {
  const { t } = useTranslation("claimForm", {
    keyPrefix: "contact_information",
  });
  const { values } = useFormikContext<Claim>();

  return (
    <ReviewSection pageDefinition={ContactInformationPage}>
      {values.phones?.[0] && <PhoneReview phone={values.phones[0]} />}
      <YesNoReview title={t("more_phones")} value={values.LOCAL_more_phones} />
      {values.phones &&
        values.phones.length > 1 &&
        values.phones
          .slice(1)
          .map((phone) => <PhoneReview phone={phone} key={phone.number} />)}
      <YesNoReview
        title={t("interpreter_required.label")}
        value={values.interpreter_required}
      />
      {values.preferred_language && (
        <ReviewElement
          title={t("preferred_language.label")}
          text={values.preferred_language}
        />
      )}
    </ReviewSection>
  );
};
