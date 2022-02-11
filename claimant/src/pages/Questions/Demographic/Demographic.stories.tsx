import { ComponentMeta, ComponentStory } from "@storybook/react";
import { useTranslation } from "react-i18next";
import { Formik, Form } from "formik";

import { Demographic, DemographicPage } from "./Demographic";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Pages/Demographic Information",
  component: Demographic,
} as ComponentMeta<typeof Demographic>;

const Template: ComponentStory<typeof Demographic> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = DemographicPage.pageSchema(t);
  const initialValues = {
    sex: undefined,
    ethnicity: undefined,
    race: [],
    education_level: undefined,
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Demographic />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
