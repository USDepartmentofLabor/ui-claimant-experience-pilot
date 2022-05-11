import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { Fieldset } from "@trussworks/react-uswds";

import { BooleanRadio } from "./BooleanRadio";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Boolean Radio",
  component: BooleanRadio,
} as ComponentMeta<typeof BooleanRadio>;

const Template: ComponentStory<typeof BooleanRadio> = (args) => {
  const initialValues = {};

  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <Fieldset legend="Do you like to answer Yes/No questions?">
          <BooleanRadio name={args.name} onChange={args.onChange} />
        </Fieldset>
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  name: "yes_no_question",
};

export const WithOnChangeHandler = Template.bind({});
WithOnChangeHandler.args = {
  name: "yes_no_question",
  onChange: () => {
    console.log("Changed!");
  },
};
