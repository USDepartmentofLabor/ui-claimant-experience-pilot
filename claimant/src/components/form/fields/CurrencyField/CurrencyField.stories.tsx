import CurrencyField from "./CurrencyField";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { noop } from "../../../../testUtils/noop";
import * as yup from "yup";
import { Label } from "@trussworks/react-uswds";
import { yupCurrency } from "../../../../common/YupBuilder";

export default {
  title: "Components/Form/Fields/Currency Field",
  component: CurrencyField,
} as ComponentMeta<typeof CurrencyField>;

const DefaultTemplate: ComponentStory<typeof CurrencyField> = (args) => {
  const initialValues = {
    [args.name]: "",
  };

  return (
    <Formik initialValues={initialValues} onSubmit={noop}>
      <Form>
        <CurrencyField {...args} />
      </Form>
    </Formik>
  );
};

export const Default = DefaultTemplate.bind({});
Default.args = {
  id: "example_currency",
  name: "example_currency",
  label: "Example Currency Field",
};

const WithFormikValueTemplate: ComponentStory<typeof CurrencyField> = (
  args
) => {
  const initialValues = {
    [args.name]: "",
  };

  const validationSchema = yup.object().shape({
    [args.name]: yupCurrency().required(),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      {(props) => (
        <Form>
          <CurrencyField {...args} />
          <Label htmlFor={"formik_value"}>Formik Value (as cents):</Label>
          <span id="formik_value">{props.values[args.name]}</span>
        </Form>
      )}
    </Formik>
  );
};

export const ShowFormikValue = WithFormikValueTemplate.bind({});
ShowFormikValue.args = {
  id: "example_amount",
  name: "example_amount",
  label: "Type a dollar amount below",
  hint: "The cents value formik handles will be displayed below in real time",
};
