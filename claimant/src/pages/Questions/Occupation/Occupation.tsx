import { OccupationPicker } from "../../../components/form/OccupationPicker/OccupationPicker";
import { IPageDefinition } from "../../PageDefinitions";
import { TFunction } from "react-i18next";
import * as yup from "yup";

export const Occupation = () => {
  return <OccupationPicker />;
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    occupation: yup.object().shape({
      job_title: yup
        .string()
        .max(255)
        .required(t("occupation.what_is_your_occupation.required")),
      job_description: yup
        .string()
        .max(1024)
        .required(t("occupation.short_description.required")),
      bls_code: yup.string().required(t("occupation.bls_code.required")),
    }),
  });

export const OccupationPage: IPageDefinition = {
  path: "occupation",
  heading: "occupation",
  initialValues: {
    occupation: {},
  },
  Component: Occupation,
  pageSchema,
};
