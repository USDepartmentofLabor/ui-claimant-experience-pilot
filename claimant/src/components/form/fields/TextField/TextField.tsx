import React from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  TextInput,
  ErrorMessage,
} from "@trussworks/react-uswds";

type TextInputProps = React.ComponentProps<typeof TextInput>;

interface ITextFieldProps extends TextInputProps {
  label: React.ReactNode;
  labelClassName?: string;
  labelHint?: string;
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

export const TextField = ({
  label,
  labelClassName,
  labelHint,
  ...textInputProps
}: ITextFieldProps) => {
  const [fieldProps, metaProps] = useField({
    name: textInputProps.name,
    type: textInputProps.type,
  });
  const showError = metaProps.touched && !!metaProps.error;

  return (
    <FormGroup error={showError}>
      <Label
        className={labelClassName}
        hint={labelHint}
        error={showError}
        htmlFor={textInputProps.id || textInputProps.name}
      >
        {label}
      </Label>

      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TextInput {...fieldProps} {...textInputProps} />

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default TextField;