import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import TextField from "../../../components/form/fields/TextField/TextField";
import { YesNoRadio } from "../../../components/form/YesNoRadio/YesNoRadio";
import { IPageDefinition } from "../../PageDefinitions";
import { useClearFields } from "../../../hooks/useClearFields";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";

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
      <Fieldset legend={t("self_employment.label")}>
        <Fieldset legend={t("self_employment.self_employed.label")}>
          <BooleanRadio
            id="self_employment.is_self_employed"
            name="self_employment.is_self_employed"
          />
        </Fieldset>
        <Fieldset legend={t("self_employment.business_ownership.label")}>
          <YesNoRadio
            id="self_employment.ownership_in_business"
            name="self_employment.ownership_in_business"
          />
        </Fieldset>
        {data.ownership_in_business === "yes" && (
          <TextField
            label={t("self_employment.business_name.label")}
            type="text"
            id="self_employment.name_of_business"
            name="self_employment.name_of_business"
          />
        )}
      </Fieldset>
      <Fieldset legend={t("self_employment.business_interests.label")}>
        <Fieldset legend={t("self_employment.corporate_officer.label")}>
          <YesNoRadio
            id="self_employment.is_corporate_officer"
            name="self_employment.is_corporate_officer"
          />
        </Fieldset>
        {data.is_corporate_officer === "yes" && (
          <TextField
            label={t("self_employment.corporation_name.label")}
            type="text"
            id="self_employment.name_of_corporation"
            name="self_employment.name_of_corporation"
          />
        )}
        <Fieldset legend={t("self_employment.related_to_owner.label")}>
          <YesNoRadio
            id="self_employment.related_to_owner"
            name="self_employment.related_to_owner"
          />
        </Fieldset>
        {data.related_to_owner === "yes" && (
          <Fieldset
            legend={t("self_employment.corporation_or_partnership.label")}
          >
            <YesNoRadio
              id="self_employment.corporation_or_partnership"
              name="self_employment.corporation_or_partnership"
            />
          </Fieldset>
        )}
      </Fieldset>
    </>
  );
};

const schemaFields: ClaimSchemaField[] = ["self_employment"];

export const SelfEmploymentPage: IPageDefinition = {
  path: "self-employment",
  heading: "self_employment",
  schemaFields: schemaFields,
  initialValues: {},
  Component: SelfEmployment,
};
