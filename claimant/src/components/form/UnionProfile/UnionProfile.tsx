import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
import TextField from "../../../components/form/fields/TextField/TextField";
import { YesNoQuestion } from "../YesNoQuestion/YesNoQuestion";
import { useClearFields } from "../../../hooks/useClearFields";

export const UnionProfile = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "union" });
  const {
    values: { union },
  } = useFormikContext<ClaimantInput>();

  const formData: ClaimantInput["union"] = union || {};

  // Remove conditional data if previous answer is changed
  useClearFields(formData.is_union_member === false, [
    "union.union_name",
    "union.union_local_number",
    "union.required_to_seek_work_through_hiring_hall",
  ]);

  return (
    <>
      <YesNoQuestion
        question={t("is_union_member.label")}
        id="union.is_union_member"
        name="union.is_union_member"
      />
      {formData.is_union_member === true && (
        <>
          <TextField
            label={t("union_name.label")}
            type="text"
            id="union.union_name"
            name="union.union_name"
          />
          <TextField
            label={t("union_local_number.label")}
            type="text"
            id="union.union_local_number"
            name="union.union_local_number"
          />
          <YesNoQuestion
            question={t("required_to_seek_work_through_hiring_hall.label")}
            id="union.required_to_seek_work_through_hiring_hall"
            name="union.required_to_seek_work_through_hiring_hall"
          />
        </>
      )}
    </>
  );
};
