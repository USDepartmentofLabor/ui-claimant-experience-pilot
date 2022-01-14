import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import TextField from "../../../components/form/fields/TextField/TextField";
import { BooleanRadio } from "../BooleanRadio/BooleanRadio";

export const UnionProfile = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "union" });
  const {
    values: { union },
    setFieldValue,
    // setFieldTouched,
  } = useFormikContext<ClaimantInput>();

  const formData: ClaimantInput["union"] = union || {};

  // Remove conditional data if previous answer is changed
  useEffect(() => {
    if (formData.is_union_member === false) {
      setFieldValue("union.union_name", undefined);
      setFieldValue("union.union_local_number", undefined);
      setFieldValue(
        "union.required_to_seek_work_through_hiring_hall",
        undefined
      );
    } else {
      // TODO ?
      // "touch" all the child fields so errors display
      // setFieldTouched("union.union_name", true, );
    }
  }, [formData.is_union_member]);

  return (
    <>
      <Fieldset legend={t("is_union_member.label")}>
        <BooleanRadio id="union.is_union_member" name="union.is_union_member" />
      </Fieldset>
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
          <Fieldset
            legend={t("required_to_seek_work_through_hiring_hall.label")}
          >
            <BooleanRadio
              id="union.required_to_seek_work_through_hiring_hall"
              name="union.required_to_seek_work_through_hiring_hall"
            />
          </Fieldset>
        </>
      )}
    </>
  );
};
