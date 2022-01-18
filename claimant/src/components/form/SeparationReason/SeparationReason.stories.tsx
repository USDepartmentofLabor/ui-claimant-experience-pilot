import { SeparationReason } from "./SeparationReason";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";
import YupBuilder from "../../../common/YupBuilder"; // TODO native

export default {
  title: "Components/Form/Separation Reason",
  component: SeparationReason,
} as ComponentMeta<typeof SeparationReason>;
const noop = () => undefined;

const Template: ComponentStory<typeof SeparationReason> = () => {
  const validationSchema = YupBuilder("claim-v1.0", ["employers"]);
  const initialValues = {
    employers: [{ ...EMPLOYER_SKELETON }],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <SeparationReason segment="0" />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
