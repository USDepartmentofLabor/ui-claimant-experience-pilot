import { useTranslation } from "react-i18next";
import { ClaimSchemaFields } from "../../common/YupBuilder";
import Address from "../../components/form/Address/Address";
import { RadioField } from "../../components/form/fields/RadioField/RadioField";

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
      <RadioField
        id="mailing_address_different"
        name={t("label.mailing_address_different")}
        options={[
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ]}
      />
    </>
  );
};
