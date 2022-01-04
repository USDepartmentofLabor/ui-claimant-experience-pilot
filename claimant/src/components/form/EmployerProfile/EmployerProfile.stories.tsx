import { EmployerProfile } from "./EmployerProfile";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import YupBuilder from "../../../common/YupBuilder";
import { EmployerInformationPage } from "../../../pages/Questions/EmployerInformation/EmployerInformation";

export default {
  title: "Components/Form/Employer Profile",
  component: EmployerProfile,
} as ComponentMeta<typeof EmployerProfile>;
const noop = () => undefined;

const Template: ComponentStory<typeof EmployerProfile> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    EmployerInformationPage.schemaFields
  );
  const initialValues = {
    employers: [
      {
        name: "",
        LOCAL_still_working: null,
        first_work_date: "",
        last_work_date: "",
        address: {
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipcode: "",
        },
        LOCAL_same_address: null,
        work_site_address: {
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipcode: "",
        },
        phones: [{ number: "" }, { number: "" }],
        LOCAL_same_phone: null,
        fein: "",
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
        <EmployerProfile segment="0" />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
