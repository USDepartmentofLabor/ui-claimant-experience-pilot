import { OccupationPicker } from "./OccupationPicker";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import YupBuilder from "../../../common/YupBuilder";

export default {
  title: "Components/Form/Occupation Picker",
  component: OccupationPicker,
} as ComponentMeta<typeof OccupationPicker>;
const noop = () => undefined;

const Template: ComponentStory<typeof OccupationPicker> = () => {
  const validationSchema = YupBuilder("claim-v1.0", ["occupation"]);
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
