import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import { addressToString } from "../../../utils/format";
import { PersonalInformationPage } from "../PersonalInformation/PersonalInformation";
import { ReviewElement, ReviewSection } from "./ReviewSection";

export const PersonalInformationReview = () => {
  const { t: t } = useTranslation("common");
  const { t: formT } = useTranslation("claimForm");
  const { t: contactT } = useTranslation("contact");
  const { values } = useFormikContext<Claim>();

  return (
    <ReviewSection
      title={t("page_headings.personal")}
      editPath={PersonalInformationPage.path}
    >
      {values.claimant_name && <NameReview name={values.claimant_name} />}
      <ReviewElement
        title={formT("name.claimant_has_alternate_names.label")}
        text={t(values.LOCAL_claimant_has_alternate_names ? "yes" : "no")}
      />
      {values.alternate_names &&
        values.alternate_names.map((name) => (
          <NameReview key={name.first_name + name.last_name} name={name} />
        ))}
      {values.residence_address && (
        <ReviewElement
          title={contactT("label.primary_address")}
          text={addressToString(values.residence_address)}
        />
      )}
      <ReviewElement
        title={contactT("label.mailing_address_same")}
        text={t(values.LOCAL_mailing_address_same ? "yes" : "no")}
      />
      {!values.LOCAL_mailing_address_same && values.mailing_address && (
        <ReviewElement
          title={contactT("label.mailing_address")}
          text={addressToString(values.mailing_address)}
        />
      )}
    </ReviewSection>
  );
};

const NameReview = ({ name }: { name: PersonName }) => {
  const { t: t } = useTranslation("common");
  const { t: formT } = useTranslation("claimForm");
  return (
    <>
      <ReviewElement
        title={formT("name.first_name.label")}
        text={name.first_name}
      />
      <ReviewElement
        title={formT("name.middle_name.label")}
        text={name.middle_name || t("none")}
      />
      <ReviewElement
        title={formT("name.last_name.label")}
        text={name.last_name}
      />
    </>
  );
};
