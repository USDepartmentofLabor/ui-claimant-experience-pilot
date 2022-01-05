import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";

import { CLAIMANT_NAMES_SCHEMA_FIELDS, ClaimantNames } from "./ClaimantNames";
import YupBuilder from "../../../common/YupBuilder";

export default {
  title: "Components/Form/Claimant Names",
  component: ClaimantNames,
} as ComponentMeta<typeof ClaimantNames>;

const noop = () => undefined;

const Template: ComponentStory<typeof ClaimantNames> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    CLAIMANT_NAMES_SCHEMA_FIELDS
  );

  const initialValues = {
    claimant_name: {
      first_name: "",
      middle_name: "",
      last_name: "",
    },
    LCOAL_claimant_has_alternate_names: undefined,
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
