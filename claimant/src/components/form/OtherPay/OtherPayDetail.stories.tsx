import { ComponentMeta, ComponentStory } from "@storybook/react";

import OtherPayDetail from "./OtherPayDetail";
import { Form, Formik } from "formik";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Other Pay Detail",
  component: OtherPayDetail,
} as ComponentMeta<typeof OtherPayDetail>;

const Template: ComponentStory<typeof OtherPayDetail> = () => {
  const initialValues = { other_pay: [] };

  const props = {
    name: "paid_time_off",
    label: "PTO",
    description: "Power train operator",
  };
  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <OtherPayDetail {...props} />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
