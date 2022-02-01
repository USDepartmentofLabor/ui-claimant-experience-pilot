import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Formik, Form } from "formik";
import { useTranslation } from "react-i18next";

import { noop } from "../../../testUtils/noop";
import { DisabilityStatus, DisabilityStatusPage } from "./DisabilityStatus";

export default {
  title: "Components/Form/Disability Status Info",
  component: DisabilityStatus,
} as ComponentMeta<typeof DisabilityStatus>;

const Template: ComponentStory<typeof DisabilityStatus> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = DisabilityStatusPage.pageSchema(t);

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
