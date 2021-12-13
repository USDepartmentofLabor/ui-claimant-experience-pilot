import { useTranslation } from "react-i18next";
import TextField from "../../components/form/fields/TextField";
import { ClaimSchemaFields } from "../../common/YupBuilder";
import DropdownField from "../../components/form/fields/DropdownField";
import FieldGroup from "../../components/form/FieldGroup";
import CheckboxField from "../../components/form/fields/CheckboxField";

// the schema fields that appear on this page
// only worry about top-level objects
export const ContactInformationFields: ClaimSchemaFields[] = [
  "claimant_name",
  "alternate_names",
  "email",
  "birthdate",
  "ssn",
];

export const ContactInformation = () => {
  const { t } = useTranslation("home");

  return (
    <>
      <FieldGroup>
        <TextField
          name="address.address1"
          label={t("label.address.address1")}
          type="text"
          id="address.address1"
        />
        <TextField
          name="address.address2"
          label={t("label.address.address2")}
          type="text"
          id="address.address2"
        />
        <TextField
          name="address.city"
          label={t("label.address.city")}
          type="text"
          id="address.city"
        />
        <DropdownField
          name="address.state"
          label={t("label.address.state")}
          id="address.state"
          options={[
            //placeholder
            { id: "AR", label: "Arkansas" },
            { id: "NJ", label: "New Jersey" },
          ]}
        />
        <TextField
          name="address.zip"
          label={t("label.address.zip")}
          type="text"
          id="address.zip"
        />
      </FieldGroup>
    </>
  );
};
