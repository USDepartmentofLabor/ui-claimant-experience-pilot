import React from "react";
import { useField } from "formik";
import { Checkbox } from "@trussworks/react-uswds";

/**
 * This component renders a checkbox
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

export const CheckboxField = (
  checkboxProps: React.ComponentProps<typeof Checkbox>
) => {
  const [fieldProps] = useField({ name: checkboxProps.name, type: "checkbox" });

  /* eslint-disable-next-line react/jsx-props-no-spreading */
  return <Checkbox {...fieldProps} {...checkboxProps} />;
};

export default CheckboxField;
