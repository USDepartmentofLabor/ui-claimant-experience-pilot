import { useTranslation } from "react-i18next";
import { ClaimSchemaFields } from "../../common/YupBuilder";

export const ContactInformationFields: ClaimSchemaFields[] = [
  "claimant_name",
  "alternate_names",
  "email",
  "birthdate",
  "ssn",
];
