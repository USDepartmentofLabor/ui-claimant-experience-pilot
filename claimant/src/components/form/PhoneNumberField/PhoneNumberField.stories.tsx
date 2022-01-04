import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Fieldset } from "@trussworks/react-uswds";
import { PhoneNumberField } from "./PhoneNumberField";

export default {
  title: "Components/Form/PhoneNumberField",
  component: PhoneNumberField,
} as ComponentMeta<typeof PhoneNumberField>;

const noop = () => undefined;

const Template: ComponentStory<typeof PhoneNumberField> = (args) => {
  const { t } = useTranslation("home");

  const validationSchema = yup.object().shape({
    [args.name]: yup.object().shape({
      type: yup.string().optional(),
      number: yup.string().required(t("validation.required")),
      sms: yup.string().optional(),
    }),
  });

  const initialValues = {
    [args.name]: {
      type: "",
      number: "",
      sms: false,
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Fieldset>
          <PhoneNumberField {...args} />
        </Fieldset>
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "sample_phone",
  name: "sample_phone",
};
