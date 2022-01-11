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
    union: {
      is_union_member: true,
      required_to_seek_work_through_hiring_hall: true,
      union_name: "United ACME",
      union_local_number: "12345",
    },
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
