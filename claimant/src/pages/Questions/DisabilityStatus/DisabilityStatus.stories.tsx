import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";

import YupBuilder from "../../../common/YupBuilder";
import { noop } from "../../../testUtils/noop";
import { DisabilityStatus, DisabilityStatusPage } from "./DisabilityStatus";

export default {
  title: "Components/Form/Disability Status Info",
  component: DisabilityStatus,
} as ComponentMeta<typeof DisabilityStatus>;

const Template: ComponentStory<typeof DisabilityStatus> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    DisabilityStatusPage.schemaFields
  );

  return (
    <Formik
      initialValues={{}}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <DisabilityStatus />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
