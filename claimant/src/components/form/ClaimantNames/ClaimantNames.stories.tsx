import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";

import { ClaimantNames } from "./ClaimantNames";
import YupBuilder from "../../../common/YupBuilder";
import { PersonalInformationFields } from "../../../pages/Questions/PersonalInformation";

export default {
  title: "Components/Form/Claimant Names",
  component: ClaimantNames,
} as ComponentMeta<typeof ClaimantNames>;

const noop = () => undefined;

const Template: ComponentStory<typeof ClaimantNames> = () => {
  const validationSchema = YupBuilder("claim-v1.0", PersonalInformationFields);

  const initialValues = {
    claimant_name: {
      first_name: "",
      middle_name: "",
      last_name: "",
    },
    alternate_names: [
      {
        first_name: "",
        middle_name: "",
        last_name: "",
      },
    ],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <ClaimantNames />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
