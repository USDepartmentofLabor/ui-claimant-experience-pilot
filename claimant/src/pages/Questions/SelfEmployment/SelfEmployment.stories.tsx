import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";
import { noop } from "../../../testUtils/noop";
import { SelfEmployment, SelfEmploymentPage } from "./SelfEmployment";

export default {
  title: "Pages/Self Employment",
  component: SelfEmployment,
} as ComponentMeta<typeof SelfEmployment>;

const Template: ComponentStory<typeof SelfEmployment> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = SelfEmploymentPage.pageSchema?.(t);
  const initialValues = { self_employment: {} };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={noop}
      validationSchema={validationSchema}
    >
      <Form>
        <SelfEmployment />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
