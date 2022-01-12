import { UnionProfile } from "./UnionProfile";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import YupBuilder from "../../../common/YupBuilder";

export default {
  title: "Components/Form/Union Profile",
  component: UnionProfile,
} as ComponentMeta<typeof UnionProfile>;
const noop = () => undefined;

const Template: ComponentStory<typeof UnionProfile> = () => {
  const validationSchema = YupBuilder("claim-v1.0", ["union"]);
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
