import React, { ReactNode } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  TextInput,
  ErrorMessage,
} from "@trussworks/react-uswds";
import { useShowErrors } from "../../../../hooks/useShowErrors";

type TextInputProps = React.ComponentProps<typeof TextInput>;

interface ITextFieldProps extends TextInputProps {
  label: ReactNode;
  labelClassName?: string;
  labelHint?: string;
  hint?: ReactNode;
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
  hint,
  ...textInputProps
}: ITextFieldProps) => {
  const [fieldProps, metaProps] = useField({
    name: textInputProps.name,
    type: textInputProps.type,
  });
  const showError = useShowErrors(textInputProps.name);

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
      <TextInput
        {...fieldProps}
        data-testid={textInputProps.id}
        value={fieldProps.value || ""}
        {...textInputProps}
      />

      <div className="usa-hint" id={`${textInputProps.name}-hint`}>
        {hint}
      </div>

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default TextField;
