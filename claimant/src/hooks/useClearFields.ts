import { useCallback, useEffect } from "react";
import { useFormikContext } from "formik";
import isEqual from "lodash/isEqual";

const DEFAULT_VALUE = undefined;
const DEFAULT_TOUCHED = false;

type FieldWithConfiguredClear = {
  fieldName: string;
  value?: unknown;
  touched?: boolean;
};

type Field = string | FieldWithConfiguredClear;

const isFieldWithConfiguredClear = (
  field: Field
): field is FieldWithConfiguredClear =>
  (field as FieldWithConfiguredClear).fieldName !== undefined;

export const useClearFields = (
  shouldClear: boolean | undefined,
  fields: Field | Field[]
) => {
  const { getFieldMeta, setFieldValue, setFieldTouched } =
    useFormikContext<ClaimantInput>();

  const clearField = useCallback(
    (field: Field) => {
      const clear = (fieldName: string, value: unknown, touched: boolean) => {
        const meta = getFieldMeta(fieldName);
        if (!isEqual(meta.value, value)) {
          setFieldValue(fieldName, value);
        }
        if (!isEqual(meta.touched, touched)) {
          setFieldTouched(fieldName, touched);
        }
      };

      if (isFieldWithConfiguredClear(field)) {
        const value = field.value || DEFAULT_VALUE;
        const touched = field.touched || DEFAULT_TOUCHED;
        clear(field.fieldName, value, touched);
      } else {
        clear(field, DEFAULT_VALUE, DEFAULT_TOUCHED);
      }
    },
    [getFieldMeta, setFieldValue, setFieldTouched]
  );

  useEffect(() => {
    if (shouldClear) {
      if (Array.isArray(fields)) {
        fields.forEach((field) => clearField(field));
      } else {
        clearField(fields);
      }
    }
  }, [shouldClear, clearField, fields]);
};
