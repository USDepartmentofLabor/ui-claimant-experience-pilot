import { ClaimSchemaField } from "../../../common/YupBuilder";
import {
  ClaimantNames,
  CLAIMANT_NAMES_SCHEMA_FIELDS,
} from "../../../components/form/ClaimantNames/ClaimantNames";
import {
  CLAIMANT_ADDRESS_SCHEMA_FIELDS,
  ClaimantAddress,
} from "../../../components/form/ClaimantAddress/ClaimantAddress";
import { IPageDefinition } from "../../PageDefinitions";
import { ADDRESS_SKELETON } from "../../../utils/claim_form";

const schemaFields: ClaimSchemaField[] = [
  ...CLAIMANT_NAMES_SCHEMA_FIELDS,
  ...CLAIMANT_ADDRESS_SCHEMA_FIELDS,
];

const PersonalInformation = () => {
  return (
    <>
      <ClaimantNames />
      <ClaimantAddress />
    </>
  );
};

export const PersonalInformationPage: IPageDefinition = {
  path: "personal-information",
  schemaFields: schemaFields,
  initialValues: {
    claimant_name: { first_name: "", middle_name: "", last_name: "" },
    LOCAL_claimant_has_alternate_names: undefined,
    alternate_names: [],
    residence_address: ADDRESS_SKELETON,
    LOCAL_mailing_address_same: false,
    mailing_address: ADDRESS_SKELETON,
  },
  Component: PersonalInformation,
};
