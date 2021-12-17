import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import i18next from "i18next";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { ClaimSchemaFields } from "../../../common/YupBuilder";
import * as yup from "yup";
import Address from "../Address/Address";
import { CheckboxField } from "../fields/CheckboxField";
import { ADDRESS_SKELETON } from "../../../utils/claim_form";

export const CLAIMANT_ADDRESS_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  "residence_address",
  "mailing_address",
];

type ClaimantAddressValues = {
  LOCAL_mailing_address_same: boolean;
  residence_address: AddressType;
  mailing_address: AddressType;
};

export const CLAIMANT_ADDRESS_ADDITIONAL_VALIDATIONS = {
  LOCAL_mailing_address_same: yup
    .string()
    .required(i18next.t("validation.required")),
};

export const ClaimantAddress = () => {
  const { t } = useTranslation("contact");

  const { values } = useFormikContext<ClaimantAddressValues>();

  useEffect(() => {
    if (values.LOCAL_mailing_address_same) {
      values.mailing_address = values.residence_address;
    } else {
      values.mailing_address = ADDRESS_SKELETON;
    }
  }, [values.LOCAL_mailing_address_same]);

  return (
    <>
      <Fieldset legend={t("label.primary_address")}>
        <Address basename="residence_address" />
      </Fieldset>
      <CheckboxField
        id="LOCAL_mailing_address_same"
        name="LOCAL_mailing_address_same"
        data-testid="LOCAL_mailing_address_same"
        label={t("label.mailing_address_same")}
      />
      {!values.LOCAL_mailing_address_same && (
        <Fieldset legend={t("label.mailing_address")}>
          <Address basename="mailing_address" />
        </Fieldset>
      )}
    </>
  );
};
