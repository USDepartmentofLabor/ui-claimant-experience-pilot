import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import YupBuilder from "../../../common/YupBuilder";

import { noop } from "../../../testUtils/noop";
import { SelfEmployment, SelfEmploymentPage } from "./SelfEmployment";

export default {
  title: "Components/Form/Self Employment",
  component: SelfEmployment,
} as ComponentMeta<typeof SelfEmployment>;

const Template: ComponentStory<typeof SelfEmployment> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    SelfEmploymentPage.schemaFields
  );
  const initialValues = { self_employment: {} };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={noop}
      validationSchema={validationSchema}
    >
      <Form>
        <SelfEmployment />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
