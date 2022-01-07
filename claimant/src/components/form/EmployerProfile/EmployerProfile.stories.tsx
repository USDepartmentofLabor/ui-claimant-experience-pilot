import { EmployerProfile } from "./EmployerProfile";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import YupBuilder from "../../../common/YupBuilder";
import { EmployerInformationPage } from "../../../pages/Questions/EmployerInformation/EmployerInformation";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Employer Profile",
  component: EmployerProfile,
} as ComponentMeta<typeof EmployerProfile>;

const Template: ComponentStory<typeof EmployerProfile> = () => {
  const validationSchema = YupBuilder(
    "claim-v1.0",
    EmployerInformationPage.schemaFields
  );

  const initialValues = {
    employers: [
      {
        name: "",
        LOCAL_still_working: undefined,
        first_work_date: "",
        last_work_date: "",
        address: {
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipcode: "",
        },
        LOCAL_same_address: undefined,
        work_site_address: {
          address1: "",
          address2: "",
          city: "",
          state: "",
          zipcode: "",
        },
        phones: [{ number: "" }, { number: "" }],
        LOCAL_same_phone: undefined,
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
