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
import states from "../../../schemas/states.json";

export const CLAIMANT_ADDRESS_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  "residence_address",
  "mailing_address",
];

type ClaimantAddressValues = {
  LOCAL_mailing_address_different: boolean;
  residence_address: AddressType;
  mailing_address: AddressType;
};

export const CLAIMANT_ADDRESS_ADDITIONAL_VALIDATIONS = {
  LOCAL_mailing_address_different: yup
    .string()
    .required(i18next.t("validation.required")),
};

interface IStates {
  [key: string]: string;
}

export const ClaimantAddress = () => {
  const { t } = useTranslation("contact");

  const { values, setFieldValue } = useFormikContext<ClaimantAddressValues>();

  useEffect(() => {
    if (values.LOCAL_mailing_address_different) {
      values.mailing_address = ADDRESS_SKELETON;
    } else {
      values.mailing_address = values.residence_address;
    }
  }, [values.LOCAL_mailing_address_different]);

  useEffect(() => {
    if (!values.LOCAL_mailing_address_different) {
      values.mailing_address = values.residence_address;
    }
  }, [values.residence_address]);

  const statesByAbbrev: IStates = states;
  const stateOptions: StateType[] = Object.keys(statesByAbbrev).map(
    (abbrev) => {
      return { id: abbrev, label: statesByAbbrev[abbrev] };
    }
  );
  stateOptions.unshift({ id: "", label: "-- Select one --" });

  return (
    <>
      <Fieldset legend={t("label.primary_address")}>
        <Address basename="residence_address" states={stateOptions} />
      </Fieldset>
      <CheckboxField
        id="LOCAL_mailing_address_different"
        name="LOCAL_mailing_address_different"
        label={t("label.mailing_address_different")}
      />
      {values.LOCAL_mailing_address_different && (
        <Fieldset legend={t("label.mailing_address")}>
          <Address basename="mailing_address" states={stateOptions} />
        </Fieldset>
      )}
    </>
  );
};
