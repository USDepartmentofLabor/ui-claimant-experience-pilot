import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import * as yup from "yup";

import Address from "./Address";
import { useTranslation } from "react-i18next";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Address",
  component: Address,
} as ComponentMeta<typeof Address>;

const Template: ComponentStory<typeof Address> = (args) => {
  const { t } = useTranslation("home");

  const validationSchema = yup.object().shape({
    [args.basename]: yup.object().shape({
      address1: yup.string().required(t("validation.required")),
      address2: yup.string().optional(),
      city: yup.string().required(t("validation.required")),
      state: yup.string().required(t("validation.required")),
      zipcode: yup
        .string()
        .matches(/^\d{5}(-\d{4})?$/, t("validation.notZipCode"))
        .required(t("validation.required")),
    }),
  });

  const initialValues = {
    [args.basename]: {
      address1: "",
      address2: "",
      city: "",
      state: "",
      zipcode: "",
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Address basename={args.basename} />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
Default.args = {
  basename: "address",
};
