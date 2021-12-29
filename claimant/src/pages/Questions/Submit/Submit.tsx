import { useTranslation } from "react-i18next";
import CheckboxField from "../../../components/form/fields/CheckboxField/CheckboxField";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { IPageDefinition } from "../../PageDefinitions";

const schemaFields: ClaimSchemaField[] = ["is_complete"];

export const Submit = () => {
  const { t } = useTranslation("home");

  return (
    <CheckboxField
      id="is_complete"
      name="is_complete"
      label={t("label.is_complete")}
      labelDescription={t("label.is_complete_description")}
      tile
    />
  );
};

export const SubmitPage: IPageDefinition = {
  path: "submit",
  schemaFields: schemaFields,
  initialValues: {
    is_complete: false,
  },
  Component: Submit,
};
