import { UnionProfile } from "./UnionProfile";
import { UnionPage } from "../../../pages/Questions/Union/Union";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

export default {
  title: "Components/Form/Union Profile",
  component: UnionProfile,
} as ComponentMeta<typeof UnionProfile>;
const noop = () => undefined;

const Template: ComponentStory<typeof UnionProfile> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = UnionPage.pageSchema(t);
  const initialValues = {
    union: {},
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={noop}
    >
      <Form>
        <UnionProfile />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
