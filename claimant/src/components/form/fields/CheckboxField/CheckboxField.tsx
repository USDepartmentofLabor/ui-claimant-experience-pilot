import React, { ChangeEvent } from "react";
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

export const CheckboxField = ({
  name,
  onChange,
  ...inputProps
}: React.ComponentProps<typeof Checkbox>) => {
  const [fieldProps] = useField({ name, type: "checkbox" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldProps.onChange(e);
    if (onChange) {
      onChange(e);
    }
  };

  /* eslint-disable-next-line react/jsx-props-no-spreading */
  return (
    <Checkbox
      {...fieldProps}
      name={name}
      onChange={handleChange}
      {...inputProps}
    />
  );
};

export default CheckboxField;
