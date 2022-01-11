import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import YupBuilder from "../../../common/YupBuilder";
import { noop } from "../../../testUtils/noop";
import {
  ContactInformation,
  ContactInformationPage,
} from "./ContactInformation";

export default {
  title: "Components/Form/Contact Info",
  component: ContactInformation,
} as ComponentMeta<typeof ContactInformation>;

const Template: ComponentStory<typeof ContactInformation> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    ContactInformationPage.schemaFields
  );

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
