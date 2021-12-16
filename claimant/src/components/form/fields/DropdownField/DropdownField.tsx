import React from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  Dropdown,
  ErrorMessage,
} from "@trussworks/react-uswds";

type DropdownOption = {
  label: string;
  value: string;
};

interface IDropdownFieldProps {
  id: string;
  name: string;
  label: React.ReactNode;
  labelClassName?: string;
  labelHint?: string;
  options: DropdownOption[];
}

/**
 * This component renders a ReactUSWDS Dropdown component inside of a FormGroup,
 * with a Label and ErrorMessage.
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

const DropdownField = ({
  name,
  id,
  label,
  labelClassName,
  labelHint,
  options,
  ...inputProps
}: IDropdownFieldProps & JSX.IntrinsicElements["select"]) => {
  const [fieldProps, metaProps] = useField({ name });
  const showError = metaProps.touched && !!metaProps.error;

  return (
    <FormGroup error={showError}>
      <Label
        className={labelClassName}
        hint={labelHint}
        error={showError}
        htmlFor={id || name}
      >
        {label}
      </Label>

      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Dropdown id={id} {...fieldProps} {...inputProps}>
        {options &&
          options.map(({ label, value }, index) => (
            <option key={`${index}_${label}_${value}`} value={value}>
              {label}
            </option>
          ))}
      </Dropdown>

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default DropdownField;
