import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Availability, AvailabilityPage } from "./Availability";
import { Form, Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import YupBuilder from "../../../common/YupBuilder";

export default {
  title: "Pages/Availability",
  component: Availability,
} as ComponentMeta<typeof Availability>;

const Template: ComponentStory<typeof Availability> = () => {
  const initialValues = AvailabilityPage.initialValues;
  const validationSchema = YupBuilder(
    "claim-v1.0",
    AvailabilityPage.schemaFields
  );

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Availability />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
