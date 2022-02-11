import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { Label } from "@trussworks/react-uswds";
import * as yup from "yup";
import { DateInputField } from "./DateInputField";
import { noop } from "../../../../testUtils/noop";
import { yupDate } from "../../../../common/YupBuilder";
import { useTranslation } from "react-i18next";

export default {
  title: "Components/Form/Fields/Date Input Field",
  component: DateInputField,
} as ComponentMeta<typeof DateInputField>;

const DefaultTemplate: ComponentStory<typeof DateInputField> = (args) => {
  const initialValues = {
    [args.name]: "",
  };

  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <DateInputField {...args} />
      </Form>
    </Formik>
  );
};

export const Default = DefaultTemplate.bind({});
Default.args = {
  id: "example_date",
  name: "example_date",
  legend: "Date Input",
};

export const Readonly = DefaultTemplate.bind({});
Readonly.args = {
  id: "example_date",
  name: "example_date",
  legend: "Date Input",
  readOnly: true,
  disabled: true,
};

const WithFormikValueTemplate: ComponentStory<typeof DateInputField> = (
  args
) => {
  const initialValues = {
    [args.name]: "",
  };
  const { t } = useTranslation("home");

  const validationSchema = yup.object().shape({
    [args.name]: yupDate(t, String(args.legend)),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      {(props) => (
        <Form>
          <DateInputField {...args} />
          <Label htmlFor={"formik_value"}>Formik Value:</Label>
          <span id="formik_value">{props.values[args.name]}</span>
        </Form>
      )}
    </Formik>
  );
};

export const ShowFormikValue = WithFormikValueTemplate.bind({});
ShowFormikValue.args = {
  id: "example_date",
  name: "example_date",
  legend: "Type a date below",
  hint: "The ISO8601 value formik handles will be displayed below in real time",
};
