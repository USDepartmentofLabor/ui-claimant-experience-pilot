import { ComponentMeta, ComponentStory } from "@storybook/react";
import { useTranslation } from "react-i18next";
import { Formik, Form } from "formik";

import {
  DemographicInformation,
  DemographicInformationPage,
} from "./DemographicInformation";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Pages/Demographic Information",
  component: DemographicInformation,
} as ComponentMeta<typeof DemographicInformation>;

const Template: ComponentStory<typeof DemographicInformation> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = DemographicInformationPage.pageSchema(t);
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
        <DemographicInformation />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
