import { ComponentMeta, ComponentStory } from "@storybook/react";
import { useTranslation } from "react-i18next";
import { Availability, AvailabilityPage } from "./Availability";
import { Form, Formik } from "formik";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Pages/Availability",
  component: Availability,
} as ComponentMeta<typeof Availability>;

const Template: ComponentStory<typeof Availability> = () => {
  const { t } = useTranslation("claimForm");
  const initialValues = AvailabilityPage.initialValues;
  const validationSchema = AvailabilityPage.pageSchema?.(t);

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
