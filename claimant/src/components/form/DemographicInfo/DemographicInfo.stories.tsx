import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import { Fieldset } from "@trussworks/react-uswds";

import { DemographicInfo } from "./DemographicInfo";
import * as yup from "yup";
import { useTranslation } from "react-i18next";

export default {
  title: "Components/Form/Demographic Info",
  component: DemographicInfo,
} as ComponentMeta<typeof DemographicInfo>;

const noop = () => undefined;

const Template: ComponentStory<typeof DemographicInfo> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = yup.object().shape({
    sex: yup.string().required(t("sex.errors.required")),
    ethnicity: yup.string().required(t("ethnicity.errors.required")),
    race: yup.string().required(t("race.errors.required")),
    educationLevel: yup
      .string()
      .required(t("education_level.errors.required"))
      .not(["none_selected"], t("education_level.errors.required")),
  });
  const initialValues = {
    dob: new Date(2001, 11, 21).toDateString(),
    sex: undefined,
    ethnicity: undefined,
    race: [],
    educationLevel: "none_selected",
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <Fieldset>
          <DemographicInfo />
        </Fieldset>
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
