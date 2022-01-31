import { ComponentMeta, ComponentStory } from "@storybook/react";

import OtherPay from "./OtherPay";
import { Form, Formik } from "formik";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Other Pay",
  component: OtherPay,
} as ComponentMeta<typeof OtherPay>;

const Template: ComponentStory<typeof OtherPay> = () => {
  const initialValues = { other_pay: [] };
  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <OtherPay />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
