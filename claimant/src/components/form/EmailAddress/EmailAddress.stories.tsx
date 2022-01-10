import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import * as yup from "yup";

import { useTranslation } from "react-i18next";
import { EmailAddress } from "./EmailAddress";

export default {
  title: "Components/Form/Email Address",
  component: EmailAddress,
} as ComponentMeta<typeof EmailAddress>;

const noop = () => undefined;

const Template: ComponentStory<typeof EmailAddress> = () => {
  const { t } = useTranslation("home");

  const validationSchema = yup.object().shape({
    email_address: yup
      .string()
      .matches(/^\S+@\S+\.\S+$/, t("validation.notEmail"))
      .required(t("validation.required")),
    confirm_email_address: yup
      .string()
      .required(t("validation.required"))
      .test(
        "mustMatch",
        t("validation.email_does_not_match"),
        function (value) {
          return (
            this.parent.email_address?.toLowerCase() === value?.toLowerCase()
          );
        }
      ),
  });

  const initialValues = {
    email_address: "",
    confirm_email_address: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <EmailAddress />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {};
