import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { Button, Fieldset } from "@trussworks/react-uswds";
import { PhoneNumberField } from "./PhoneNumberField";
import { yupPhone } from "../../../common/YupBuilder";
import * as yup from "yup";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/PhoneNumberField",
  component: PhoneNumberField,
} as ComponentMeta<typeof PhoneNumberField>;

const Template: ComponentStory<typeof PhoneNumberField> = (args) => {
  const { t } = useTranslation("common");

  const initialValues = {
    [args.name]: {
      type: "",
      number: "",
      sms: false,
    },
  };

  const validationSchema = yup.object().shape({ [args.name]: yupPhone(t) });

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
        <Button type="submit">Validate me</Button>
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  id: "sample_phone",
  name: "sample_phone",
};
