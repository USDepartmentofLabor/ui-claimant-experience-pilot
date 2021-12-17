import { ClaimSchemaFields } from "../../common/YupBuilder";
import {
  ClaimantNames,
  CLAIMANT_NAMES_SCHEMA_FIELDS,
  CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS,
} from "../../components/form/ClaimantNames/ClaimantNames";
import {
  CLAIMANT_ADDRESS_SCHEMA_FIELDS,
  CLAIMANT_ADDRESS_ADDITIONAL_VALIDATIONS,
  ClaimantAddress,
} from "../../components/form/ClaimantAddress/ClaimantAddress";

// the schema fields that appear on this page
// only worry about top-level objects
export const PERSONAL_INFORMATION_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  ...CLAIMANT_NAMES_SCHEMA_FIELDS,
  ...CLAIMANT_ADDRESS_SCHEMA_FIELDS,
];

export const PERSONAL_INFORMATION_ADDITIONAL_VALIDATIONS = {
  ...CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS,
  ...CLAIMANT_ADDRESS_ADDITIONAL_VALIDATIONS,
};

export const PersonalInformation = () => {
  return (
    <>
      <ClaimantNames />
      <ClaimantAddress />
    </>
  );
};
