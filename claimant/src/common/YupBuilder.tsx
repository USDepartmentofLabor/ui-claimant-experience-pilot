import convertToYup, { Config } from "json-schema-yup-transformer";
import { JSONSchema7 } from "json-schema";
import claim_v1_0 from "../schemas/claim-v1.0.json";
import * as jref from "json-ref-lite";

export type ClaimSchemaField = keyof typeof claim_v1_0.properties;

import { TFunction } from "react-i18next";
import * as yup from "yup";

// TODO setLocale to customize min/max/matches errors
// https://github.com/jquense/yup#error-message-customization

export const yupPhone = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    number: yup.string().required(t("phone.number.required")),
    type: yup
      .mixed()
      .oneOf(["mobile", "home", "work"])
      .required(t("phone.type.required")),
    sms: yup.boolean(),
  });

export const yupName = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    first_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.first_name.required")),
    last_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.last_name.required")),
    middle_name: yup.string().nullable().max(36),
  });

export const yupAddress = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    address1: yup.string().max(64).required(t("address.address1.required")),
    address2: yup.string().max(64),
    city: yup.string().max(64).required(t("address.city.required")),
    state: yup.string().max(2).required(t("address.state.required")), // TODO enum?
    zipcode: yup
      .string()
      .max(12)
      .matches(/^\d{5}(-\d{4})?$/)
      .required(t("address.zipcode.required")),
  });

interface SchemaLookup {
  [key: string]: JSONSchema7;
}

interface SchemaConfig {
  [key: string]: Config;
}

const schemas: SchemaLookup = {
  // eslint-disable-next-line
  "claim-v1.0": claim_v1_0 as any as JSONSchema7,
};

const schemaConfigs: SchemaConfig = {
  "claim-v1.0": {
    errors: {
      ssn: {
        // TODO i18n
        // Yup supports its own i18n but it seems redundant?
        // https://github.com/jquense/yup#using-a-custom-locale-dictionary
        required: "Social Security Number is required",
      },
    },
  },
};

type SchemaProperty = {
  description?: string;
  $ref?: string;
  type?: string;
  required_for_complete?: boolean;
  required_for_partial?: boolean;
};

const YupBuilder = (
  file: string,
  fieldSlice: string[] | undefined = undefined
) => {
  const schema = {
    ...schemas[file],
    properties: { ...schemas[file].properties },
  };
  const config = schemaConfigs[file];
  if (fieldSlice) {
    Object.keys(schema.properties).forEach((prop) => {
      if (!fieldSlice.includes(prop)) {
        delete schema.properties[prop];
      }
    });
  }
  // any properties left in the schema that are marked required for partial or
  // complete submission should be added to the top-level required attribute to
  // trigger validation
  Object.keys(schema.properties).forEach((prop) => {
    const propDef = schema.properties[prop] as SchemaProperty;
    if (propDef.required_for_complete || propDef.required_for_partial) {
      if (schema.required && !schema.required.includes(prop)) {
        schema.required.push(prop);
      }
    }
  });
  const derefSchema = jref.resolve(schema);
  return convertToYup(derefSchema as JSONSchema7, config);
};

export default YupBuilder;
