import { EmployerProfile } from "./EmployerProfile";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { EmployerInformationPage } from "../../../pages/Questions/EmployerInformation/EmployerInformation";
import { noop } from "../../../testUtils/noop";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";

export default {
  title: "Components/Form/Employer Profile",
  component: EmployerProfile,
} as ComponentMeta<typeof EmployerProfile>;

const Template: ComponentStory<typeof EmployerProfile> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = EmployerInformationPage.pageSchema(t);
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
        <EmployerProfile segment="0" />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
