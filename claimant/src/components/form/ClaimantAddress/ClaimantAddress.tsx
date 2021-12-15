import { useTranslation } from "react-i18next";
import i18next from "i18next";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { ClaimSchemaFields } from "../../../common/YupBuilder";
import * as yup from "yup";
import Address from "../Address/Address";
import { CheckboxField } from "../fields/CheckboxField";
import states from "../../../schemas/states.json";
import { YesNoRadio } from "../YesNoRadio/YesNoRadio";

export const CLAIMANT_ADDRESS_SCHEMA_FIELDS: ClaimSchemaFields[] = [
  "residence_address",
  "mailing_address",
];

type ClaimantAddressValues = {
  LOCAL_mailing_address_different?: string;
  residence_address: Address;
  mailing_address: Address;
};

export const CLAIMANT_ADDRESS_ADDITIONAL_VALIDATIONS = {
  LOCAL_mailing_address_different: yup
    .string()
    .required(i18next.t("validation.required")),
};

const ADDRESS_SKELETON: Address = {
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipcode: "",
};

interface IStates {
  [key: string]: string;
}

export const ClaimantAddress = () => {
  const { t } = useTranslation("contact");

  const { values, setFieldValue } = useFormikContext<ClaimantAddressValues>();
  const statesByAbbrev: IStates = states;
  const stateOptions: USState[] = Object.keys(statesByAbbrev).map((abbrev) => {
    return { id: abbrev, label: statesByAbbrev[abbrev] };
  });
  stateOptions.unshift({ id: "", label: "-- Select one --" });

  return (
    <>
      <Fieldset legend={t("label.primary_address")}>
        <Address basename="residence_address" states={stateOptions} />
      </Fieldset>
      <YesNoRadio
        id="LOCAL_mailing_address_different"
        name="LOCAL_mailing_address_different"
        label={t("label.mailing_address_different")}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          if (e.target.value === "no") {
            setFieldValue("mailing_address", values.residence_address);
          }
        }}
      />
      {values.LOCAL_mailing_address_different === "yes" && (
        <Fieldset legend={t("label.mailing_address")}>
          <Address basename="mailing_address" states={stateOptions} />
        </Fieldset>
      )}
    </>
  );
};
