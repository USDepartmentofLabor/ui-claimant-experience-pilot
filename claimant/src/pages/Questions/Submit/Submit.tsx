import { TFunction, useTranslation } from "react-i18next";
import CheckboxField from "../../../components/form/fields/CheckboxField/CheckboxField";
import { IPageDefinition } from "../../PageDefinitions";
import * as yup from "yup";

export const Submit = () => {
  const { t } = useTranslation("claimForm");

  return (
    <CheckboxField
      id="is_complete"
      name="is_complete"
      label={t("is_complete.label")}
      labelDescription={t("is_complete_description")}
      tile
    />
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    is_complete: yup.boolean().required(t("is_complete.required")),
  });

export const SubmitPage: IPageDefinition = {
  path: "submit",
  heading: "submit",
  initialValues: {
    is_complete: false,
  },
  Component: Submit,
  pageSchema,
};
