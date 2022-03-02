import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { TFunction, useTranslation } from "react-i18next";
import TextField from "../../../components/form/fields/TextField/TextField";
import { IPageDefinition } from "../../PageDefinitions";
import { useClearFields } from "../../../hooks/useClearFields";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import HelpText from "../../../components/HelpText/HelpText";
import * as yup from "yup";

export const SelfEmployment = () => {
  const {
    values: { self_employment },
  } = useFormikContext<ClaimantInput>();
  const { t } = useTranslation("claimForm");

  const data: ClaimantInput["self_employment"] = self_employment || {};

  // Remove conditional data if previous answer is changed

  useClearFields(
    data.ownership_in_business === "no",
    "self_employment.name_of_business"
  );

  useClearFields(
    data.is_corporate_officer === "no",
    "self_employment.name_of_corporation"
  );

  useClearFields(
    data.related_to_owner === "no",
    "self_employment.corporation_or_partnership"
  );

  return (
    <>
      <>
        <YesNoQuestion
          question={t("self_employment.self_employed.label")}
          id="self_employment.is_self_employed"
          name="self_employment.is_self_employed"
        />
        <YesNoQuestion
          question={t("self_employment.business_ownership.label")}
          id="self_employment.ownership_in_business"
          name="self_employment.ownership_in_business"
        />
        {data.ownership_in_business && (
          <TextField
            label={t("self_employment.business_name.label")}
            type="text"
            id="self_employment.name_of_business"
            name="self_employment.name_of_business"
          />
        )}
      </>
      <Fieldset legend={t("self_employment.business_interests.label")}>
        <YesNoQuestion
          question={t("self_employment.corporate_officer.label")}
          id="self_employment.is_corporate_officer"
          name="self_employment.is_corporate_officer"
        />
        {data.is_corporate_officer && (
          <TextField
            label={t("self_employment.corporation_name.label")}
            type="text"
            id="self_employment.name_of_corporation"
            name="self_employment.name_of_corporation"
          />
        )}
        <YesNoQuestion
          question={t("self_employment.related_to_owner.label")}
          id="self_employment.related_to_owner"
          name="self_employment.related_to_owner"
        >
          <HelpText withLeftBorder={true}>
            {t("self_employment.related_to_owner.help_text")}
          </HelpText>
        </YesNoQuestion>
        {data.related_to_owner && (
          <YesNoQuestion
            question={t("self_employment.corporation_or_partnership.label")}
            id="self_employment.corporation_or_partnership"
            name="self_employment.corporation_or_partnership"
          />
        )}
      </Fieldset>
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    self_employment: yup.object().shape({
      is_self_employed: yup
        .boolean()
        .required(t("self_employment.self_employed.required")),
      ownership_in_business: yup
        .boolean()
        .required(t("self_employment.business_ownership.required")),
      name_of_business: yup.string().when("ownership_in_business", {
        is: true,
        then: yup
          .string()
          .required(t("self_employment.business_name.required")),
      }),
      is_corporate_officer: yup
        .boolean()
        .required(t("self_employment.corporate_officer.required")),
      name_of_corporation: yup.string().when("is_corporate_officer", {
        is: true,
        then: yup
          .string()
          .required(t("self_employment.corporation_name.required")),
      }),
      related_to_owner: yup
        .boolean()
        .required(t("self_employment.related_to_owner.required")),
      corporation_or_partnership: yup.boolean().when("related_to_owner", {
        is: true,
        then: yup
          .boolean()
          .required(t("self_employment.corporation_or_partnership.required")),
      }),
    }),
  });

export const SelfEmploymentPage: IPageDefinition = {
  path: "self-employment",
  heading: "self_employment",
  initialValues: {},
  Component: SelfEmployment,
  pageSchema,
};
