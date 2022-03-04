import { ClaimantNames } from "../../../components/form/ClaimantNames/ClaimantNames";
import { ClaimantAddress } from "../../../components/form/ClaimantAddress/ClaimantAddress";
import { IPageDefinition } from "../../PageDefinitions";
import {
  ADDRESS_SKELETON,
  PERSON_NAME_SKELETON,
} from "../../../utils/claim_form";

import { yupName, yupAddress } from "../../../common/YupBuilder";
import * as yup from "yup";
import { TFunction } from "react-i18next";
import { VerifiedFields } from "../../../components/form/VerifiedFields/VerifiedFields";

const PersonalInformation = () => {
  return (
    <>
      <VerifiedFields fields={["first_name", "last_name", "address"]} />
      <ClaimantNames />
      <ClaimantAddress />
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    claimant_name: yupName(t),
    LOCAL_claimant_has_alternate_names: yup
      .boolean()
      .required(t("name.claimant_has_alternate_names.required")),
    alternate_names: yup.mixed().when("LOCAL_claimant_has_alternate_names", {
      is: true,
      then: yup.array().of(yupName(t)).min(1).required(),
    }),
    LOCAL_mailing_address_same: yup.boolean(),
    residence_address: yupAddress(t),
    mailing_address: yup.mixed().when("LOCAL_mailing_address_same", {
      is: false,
      then: yupAddress(t),
    }),
  });

export const PersonalInformationPage: IPageDefinition = {
  path: "personal",
  heading: "personal",
  initialValues: {
    claimant_name: { ...PERSON_NAME_SKELETON },
    LOCAL_claimant_has_alternate_names: undefined,
    alternate_names: [],
    residence_address: ADDRESS_SKELETON,
    LOCAL_mailing_address_same: false,
    mailing_address: ADDRESS_SKELETON,
  },
  Component: PersonalInformation,
  pageSchema,
};
