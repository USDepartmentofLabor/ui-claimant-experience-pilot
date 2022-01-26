import { ComponentMeta, ComponentStory } from "@storybook/react";
import { Form, Formik } from "formik";

import { ClaimantNames } from "./ClaimantNames";
import { yupName } from "../../../common/YupBuilder";
import { noop } from "../../../testUtils/noop";
import * as yup from "yup";
import { TFunction, useTranslation } from "react-i18next";

export default {
  title: "Components/Form/Claimant Names",
  component: ClaimantNames,
} as ComponentMeta<typeof ClaimantNames>;

const Template: ComponentStory<typeof ClaimantNames> = () => {
  const { t } = useTranslation("claimForm");
  const validationSchema = (t: TFunction<"claimForm">) =>
    yup.object().shape({
      claimant_name: yupName(t),
      LOCAL_claimant_has_alternate_names: yup.boolean().required(),
      alternate_names: yup.array().when("LOCAL_claimant_has_alternate_names", {
        is: true,
        then: yup.array().of(yupName(t)).required(),
      }),
    });

  const initialValues = {
    claimant_name: {
      first_name: "",
      middle_name: "",
      last_name: "",
    },
    LOCAL_claimant_has_alternate_names: undefined,
    alternate_names: [],
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema(t)}
      onSubmit={noop}
    >
      <Form>
        <ClaimantNames />
      </Form>
    </Formik>
  );
};

export const Default = Template.bind({});
