import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";

import {
  CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS,
  CLAIMANT_NAMES_SCHEMA_FIELDS,
  ClaimantNames,
} from "./ClaimantNames";
import YupBuilder from "../../../common/YupBuilder";
import * as yup from "yup";

export default {
  title: "Components/Form/Claimant Names",
  component: ClaimantNames,
} as ComponentMeta<typeof ClaimantNames>;

const noop = () => undefined;

const Template: ComponentStory<typeof ClaimantNames> = () => {
  const additionalValidationsSchema = yup
    .object()
    .shape(CLAIMANT_NAMES_ADDITIONAL_VALIDATIONS);

  const jsonSchemaValidationSchema = YupBuilder(
    "claim-v1.0",
    CLAIMANT_NAMES_SCHEMA_FIELDS
  );

  const validationSchema = jsonSchemaValidationSchema
    ? additionalValidationsSchema.concat(jsonSchemaValidationSchema)
    : additionalValidationsSchema;

  const initialValues = {
    claimant_name: {
      first_name: "",
      middle_name: "",
      last_name: "",
    },
    claimant_has_alternate_names: undefined,
    alternate_names: [],
  };
  ``;

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <ClaimantNames />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
