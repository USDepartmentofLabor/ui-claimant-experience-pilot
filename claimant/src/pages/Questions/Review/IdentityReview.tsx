import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { IdentityPage } from "../Identity/Identity";
import states from "../../../fixtures/states.json";
import { YesNoReview } from "./ReviewHelpers";

export const IdentityReview = () => {
  const { t } = useTranslation("claimForm");
  const { values } = useFormikContext<Claim>();

  return (
    <ReviewSection pageDefinition={IdentityPage}>
      {values.ssn && <ReviewElement title={t("ssn.label")} text={values.ssn} />}
      {values.birthdate && (
        <ReviewElement title={t("birthdate.label")} text={values.birthdate} />
      )}
      {values.state_credential?.drivers_license_or_state_id_number && (
        <ReviewElement
          title={t("state_credential.drivers_license_or_state_id_number.label")}
          text={values.state_credential.drivers_license_or_state_id_number}
        />
      )}
      {values.state_credential?.issuer && (
        <ReviewElement
          title={t("state_credential.issuer.label")}
          text={states[values.state_credential.issuer as keyof typeof states]}
        />
      )}
      <YesNoReview
        title={t("work_authorization.authorized_to_work.label")}
        value={values.work_authorization?.authorized_to_work}
      />
      {values.work_authorization?.not_authorized_to_work_explanation && (
        <ReviewElement
          title={t(
            "work_authorization.not_authorized_to_work_explanation.label"
          )}
          text={values.work_authorization.not_authorized_to_work_explanation}
        />
      )}
      {values.work_authorization?.authorization_type && (
        <ReviewElement
          title={t("work_authorization.authorization_type.label")}
          text={t(
            `work_authorization.authorization_type.options.${values.work_authorization.authorization_type}`
          )}
        />
      )}
      {values.work_authorization?.alien_registration_number && (
        <ReviewElement
          title={t("work_authorization.alien_registration_number.label")}
          text={values.work_authorization.alien_registration_number}
        />
      )}
    </ReviewSection>
  );
};
