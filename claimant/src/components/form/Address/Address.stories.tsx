import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";

import YupBuilder from "../../../common/YupBuilder";
import { PERSONAL_INFORMATION_SCHEMA_FIELDS } from "../../../pages/Questions/PersonalInformation";
import Address from "./Address";

export default {
  title: "Components/Form/Address",
  component: Address,
} as ComponentMeta<typeof Address>;

const noop = () => undefined;

const Template: ComponentStory<typeof Address> = () => {
  const jsonSchemaValidationSchema = YupBuilder(
    "claim-v1.0",
    PERSONAL_INFORMATION_SCHEMA_FIELDS
  );

  const initialValues = {
    test_address: {
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipcode: "",
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={jsonSchemaValidationSchema}
      onSubmit={noop}
    >
      <Form>
        <Address basename="residence_address" />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
