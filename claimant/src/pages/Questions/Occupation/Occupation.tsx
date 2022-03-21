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
        .min(3, t("occupation.what_is_your_occupation.min_length"))
        .max(255)
        .required(t("occupation.what_is_your_occupation.required")),
      job_description: yup
        .string()
        .max(1024)
        .required(t("occupation.short_description.required")),
      bls_code: yup.string().when("job_title", {
        is: (job_title: string) => job_title && job_title.length >= 3,
        then: yup.string().required(t("occupation.bls_code.required")),
      }),
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
