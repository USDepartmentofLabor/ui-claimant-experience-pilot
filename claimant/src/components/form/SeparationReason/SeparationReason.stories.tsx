import * as yup from "yup";
import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";

import { SeparationReason } from "./SeparationReason";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";
import { EmployerInformationPage } from "../../../pages/Questions/EmployerInformation/EmployerInformation";
import { noop } from "../../../testUtils/noop";

export default {
  title: "Components/Form/Separation Reason",
  component: SeparationReason,
} as ComponentMeta<typeof SeparationReason>;

const Template: ComponentStory<typeof SeparationReason> = () => {
  const { t } = useTranslation("claimForm");
  const employerYup = EmployerInformationPage.pageSchema(t);
  const validationSchema = yup.object().shape({
    employers: yup.object().shape({
      separation_reason: yup.reach(employerYup, "employers.separation_reason"),
      separation_option: yup.reach(employerYup, "employers.separation_option"),
      separation_comment: yup.reach(
        employerYup,
        "employers.separation_comment"
      ),
    }),
  });
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
