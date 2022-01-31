import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Identity, IdentityPage } from "./Identity";
import { Formik, Form } from "formik";
import { noop } from "../../../testUtils/noop";
import { useTranslation } from "react-i18next";

export default {
  title: "Pages/Identity Information",
  component: Identity,
} as ComponentMeta<typeof Identity>;

const Template: ComponentStory<typeof Identity> = () => {
  const { t } = useTranslation("claimForm");

  const initialValues = IdentityPage.initialValues;
  const validationSchema = IdentityPage.pageSchema?.(t);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Identity />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
