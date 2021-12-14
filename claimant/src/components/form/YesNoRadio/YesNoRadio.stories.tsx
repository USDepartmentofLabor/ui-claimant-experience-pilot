import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { Fieldset } from "@trussworks/react-uswds";

import { YesNoRadio } from "./YesNoRadio";

const noop = () => undefined;

export default {
  title: "Components/Form/Yes-No Radio",
  component: YesNoRadio,
} as ComponentMeta<typeof YesNoRadio>;

const Template: ComponentStory<typeof YesNoRadio> = (args) => {
  const initialValues = {};

  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <Fieldset legend="Do you like to answer Yes/No questions?">
          <YesNoRadio id={args.id} name={args.name} onChange={args.onChange} />
        </Fieldset>
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "yes_no_question",
  name: "yes_no_question",
};

export const WithOnChangeHandler = Template.bind({});
WithOnChangeHandler.args = {
  id: "yes_no_question",
  name: "yes_no_question",
  onChange: () => {
    console.log("Changed!");
  },
};
