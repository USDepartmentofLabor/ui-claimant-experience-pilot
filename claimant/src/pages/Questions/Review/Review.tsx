import { useField } from "formik";
import { TFunction, useTranslation } from "react-i18next";
import CheckboxField from "../../../components/form/fields/CheckboxField/CheckboxField";
import { IPageDefinition } from "../../PageDefinitions";
import { FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import * as yup from "yup";
import { PersonalInformationReview } from "./PersonalInformationReview";
import { IdentityReview } from "./IdentityReview";
import { DemographicInformationReview } from "./DemographicReview";
import { ContactInformationReview } from "./ContactInformationReview";
import { EmployersReview } from "./EmployersReview";
import { AvailabilityReview } from "./AvailabilityReview";
import { PaymentReview } from "./PaymentReview";
import { DisabilityStatusReview } from "./DisabilityStatusReview";
import { SelfEmploymentReview } from "./SelfEmploymentReview";
import { OtherPayReview } from "./OtherPayReview";
import { OccupationReview } from "./OccupationReview";
import { EducationVocationRehabReview } from "./EducationVocationRehabReview";
import { UnionReview } from "./UnionReview";
import { useShowErrors } from "../../../hooks/useShowErrors";

export const Review = () => {
  const { t } = useTranslation("claimForm");
  const name = "legal_affirmation";
  const [fieldProps, metaProps] = useField(name);
  const showError = useShowErrors(name);

  return (
    <>
      <PersonalInformationReview />
      <ContactInformationReview />
      <DemographicInformationReview />
      <IdentityReview />
      <EmployersReview />
      <SelfEmploymentReview />
      <OtherPayReview />
      <OccupationReview />
      <EducationVocationRehabReview />
      <UnionReview />
      <DisabilityStatusReview />
      <AvailabilityReview />
      <PaymentReview />
      <FormGroup error={showError}>
        <CheckboxField
          {...fieldProps}
          name={name}
          label={t("legal_affirmation.label")}
        />
        {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
      </FormGroup>
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    legal_affirmation: yup.boolean().required(t("legal_affirmation.required")),
  });

export const ReviewPage: IPageDefinition = {
  path: "review",
  heading: "review",
  initialValues: {
    is_complete: false,
  },
  Component: Review,
  pageSchema,
};
