import { useTranslation } from "react-i18next";
import CheckboxField from "../../components/form/fields/CheckboxField/CheckboxField";
import { ClaimSchemaFields } from "../../common/YupBuilder";

export const SubmitFields: ClaimSchemaFields[] = ["is_complete"];

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
