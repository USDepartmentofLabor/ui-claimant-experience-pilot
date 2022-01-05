import convertToYup, { Config } from "json-schema-yup-transformer";
import { JSONSchema7 } from "json-schema";
import claim_v1_0 from "../schemas/claim-v1.0.json";
import * as jref from "json-ref-lite";

export type ClaimSchemaField = keyof typeof claim_v1_0.properties;

interface SchemaLookup {
  [key: string]: JSONSchema7;
}

interface SchemaConfig {
  [key: string]: Config;
}

const schemas: SchemaLookup = {
  "claim-v1.0": claim_v1_0 as JSONSchema7,
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
  required_for_swa?: boolean;
  type?: string;
  $ref?: string;
  description?: string;
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
  // any properties left in the schema that are marked required_for_swa
  // should be added to the top-level required attribute to trigger validation
  Object.keys(schema.properties).forEach((prop) => {
    const propDef = schema.properties[prop] as SchemaProperty;
    if (propDef.required_for_swa) {
      if (schema.required && !schema.required.includes(prop)) {
        schema.required.push(prop);
      }
    }
  });
  const derefSchema = jref.resolve(schema);
  return convertToYup(derefSchema as JSONSchema7, config);
};

export default YupBuilder;
