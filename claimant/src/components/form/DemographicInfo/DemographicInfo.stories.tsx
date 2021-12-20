import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";

import {
  DEMOGRAPHIC_INFORMATION_SCHEMA_FIELDS,
  DemographicInfo,
} from "./DemographicInfo";
import YupBuilder from "../../../common/YupBuilder";

export default {
  title: "Components/Form/Demographic Info",
  component: DemographicInfo,
} as ComponentMeta<typeof DemographicInfo>;

const noop = () => undefined;

const Template: ComponentStory<typeof DemographicInfo> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    DEMOGRAPHIC_INFORMATION_SCHEMA_FIELDS
  );

  const initialValues = {
    birthdate: new Date(2001, 11, 21).toDateString(),
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
        <DemographicInfo />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
