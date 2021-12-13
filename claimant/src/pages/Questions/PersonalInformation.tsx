import { useTranslation } from "react-i18next";
import TextField from "../../components/form/fields/TextField";
import { ClaimSchemaFields } from "../../common/YupBuilder";
import {
  ClaimantNames,
  CLAIMANT_NAMES_SCHEMA_FIELDS,
  CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS,
} from "../../components/form/ClaimantNames/ClaimantNames";

// the schema fields that appear on this page
// only worry about top-level objects
export const PERSONAL_INFORMATION_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  ...CLAIMANT_NAMES_SCHEMA_FIELDS,
  "email",
  "birthdate",
  "ssn",
];

export const PERSONAL_INFORMATION_ADDITIONAL_VALIDATIONS = {
  ...CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS,
};

export const PersonalInformation = () => {
  const { t } = useTranslation("home");

  return (
    <>
      <ClaimantNames />
      <TextField
        name="email"
        label={t("label.email")}
        type="email"
        id="email"
      />
      <TextField
        name="birthdate"
        label={t("label.birthdate")}
        type="text"
        id="birthdate"
      />
      <TextField name="ssn" label={t("label.ssn")} type="text" id="ssn" />
    </>
  );
};
