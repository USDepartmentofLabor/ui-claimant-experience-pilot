import { Fieldset } from "@trussworks/react-uswds";
import { useTranslation } from "react-i18next";

import { TextField } from "../../../components/form/fields/TextField/TextField";
import { ClaimSchemaField } from "../../../common/YupBuilder";

import { IPageDefinition } from "../../PageDefinitions";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";

const schemaFields: ClaimSchemaField[] = [
  "interpreter_required",
  "preferred_language",
];

export const ContactInformation = () => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <Fieldset legend={t("contact_information.interpreter_required")}>
        <BooleanRadio id="interpreter_required" name="interpreter_required" />
      </Fieldset>
      <TextField
        label={t("contact_information.preferred_language")}
        id={"preferred_language"}
        name={"preferred_language"}
        type="text"
      />
    </>
  );
};

export const ContactInformationPage: IPageDefinition = {
  path: "contact-information",
  schemaFields: schemaFields,
  initialValues: {
    interpreter_required: undefined,
    preferred_language: "",
  },
  Component: ContactInformation,
};
