import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { Button } from "@trussworks/react-uswds";
import { YesNoQuestion } from "./YesNoQuestion";
import { noop } from "../../../testUtils/noop";
import * as yup from "yup";

export default {
  title: "Components/Form/Yes-No Question",
  component: YesNoQuestion,
} as ComponentMeta<typeof YesNoQuestion>;

const Template: ComponentStory<typeof YesNoQuestion> = (args) => {
  const initialValues = {};

  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <YesNoQuestion
          question="Do you like to answer Yes/No questions?"
          id={args.id}
          name={args.name}
          onChange={args.onChange}
        />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "yes_no_question",
  name: "yes_no_question",
  question: "yes or no?",
};

export const WithOnChangeHandler = Template.bind({});
WithOnChangeHandler.args = {
  id: "yes_no_question",
  name: "yes_no_question",
  question: "yes or no?",
  onChange: () => {
    console.log("Changed!");
  },
};

const WithFormikValueTemplate: ComponentStory<typeof YesNoQuestion> = (
  args
) => {
  const initialValues = {
    [args.name]: "",
  };

  const validationSchema = yup.object().shape({
    [args.name]: yup.boolean().required(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      {() => (
        <Form>
          <YesNoQuestion {...args} />
          <Button type="submit">Validate me</Button>
        </Form>
      )}
    </Formik>
  );
};

export const ShowFormikValue = WithFormikValueTemplate.bind({});
ShowFormikValue.args = {
  id: "yes_no_question",
  name: "yes_no_question",
  question: "Click the button to see validation",
};
