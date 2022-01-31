import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";
import { noop } from "../../../testUtils/noop";
import {
  ContactInformation,
  ContactInformationPage,
} from "./ContactInformation";

export default {
  title: "Pages/Contact Information",
  component: ContactInformation,
} as ComponentMeta<typeof ContactInformation>;

const Template: ComponentStory<typeof ContactInformation> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = ContactInformationPage.pageSchema(t);
  const initialValues = {
    interpreter_required: undefined,
    preferred_language: "",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <ContactInformation />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
