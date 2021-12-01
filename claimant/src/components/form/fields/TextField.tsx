import React from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  TextInput,
  ErrorMessage,
} from "@trussworks/react-uswds";

interface ITextFieldProps {
  id: string;
  name: string;
  label: React.ReactNode;
  labelClassName?: string;
  labelHint?: string;
  type: "number" | "email" | "password" | "search" | "tel" | "text" | "url";
}

// TODO consider from https://github.com/transcom/mymove/tree/master/src/components/Hint
// import Hint from 'components/Hint';

/**
 * This component renders a ReactUSWDS TextInput component inside of a FormGroup,
 * with a Label and ErrorMessage.
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

const TextField = ({
  name,
  id,
  label,
  labelClassName,
  labelHint,
  type,
  ...inputProps
}: ITextFieldProps) => {
  const [fieldProps, metaProps] = useField({ name, type });
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
      <TextInput id={id} type={type} {...fieldProps} {...inputProps} />

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default TextField;
