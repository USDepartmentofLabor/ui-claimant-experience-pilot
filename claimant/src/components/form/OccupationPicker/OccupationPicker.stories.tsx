import { OccupationPicker } from "./OccupationPicker";
import { OccupationPage } from "../../../pages/Questions/Occupation/Occupation";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

export default {
  title: "Components/Form/Occupation Picker",
  component: OccupationPicker,
} as ComponentMeta<typeof OccupationPicker>;
const noop = () => undefined;

const Template: ComponentStory<typeof OccupationPicker> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = OccupationPage.pageSchema(t);
  const initialValues = {
    occupation: {
      job_title: "nurse",
      job_description: "ER nurse",
      bls_description:
        "29-0000  Healthcare Practitioners and Technical Occupations",
      bls_code: "29-1141",
      bls_title: "Registered Nurses",
    },
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <OccupationPicker />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
