import { useField, useFormikContext } from "formik";

export const useShowErrors = (fieldName: string) => {
  const [, metaProps] = useField(fieldName);
  const { submitCount } = useFormikContext();
  return (submitCount > 0 || metaProps.touched) && !!metaProps.error;
};
