import { useTranslation } from "react-i18next";
import TextField from "../../components/form/fields/TextField";
import { ClaimSchemaFields } from "../../common/YupBuilder";
import DropdownField from "../../components/form/fields/DropdownField";
import FieldGroup from "../../components/form/FieldGroup";
import CheckboxField from "../../components/form/fields/CheckboxField";
import Address from "../../components/form/Address/Address";

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
      <Address
        basename="residence_address"
        states={[
          //placeholder
          { id: "AR", label: "Arkansas" },
          { id: "NJ", label: "New Jersey" },
        ]}
      />
    </>
  );
};
