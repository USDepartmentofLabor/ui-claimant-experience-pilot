import React, { FocusEventHandler, ReactNode, useRef, useState } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  TextInput,
  ErrorMessage,
  InputPrefix,
  InputSuffix,
} from "@trussworks/react-uswds";
import { useShowErrors } from "../../../../hooks/useShowErrors";
import classnames from "classnames";
import { useFocusFirstError } from "../../../../hooks/useFocusFirstError";

type TextInputProps = Partial<React.ComponentProps<typeof TextInput>> &
  Omit<React.ComponentProps<typeof TextInput>, "id">;

interface ITextFieldProps extends TextInputProps {
  label: ReactNode;
  labelClassName?: string;
  labelHint?: string;
  hint?: ReactNode;
  inputPrefix?: ReactNode;
  inputSuffix?: ReactNode;
  fieldAddon?: ReactNode;
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
  inputPrefix,
  inputSuffix,
  fieldAddon,
  ...textInputProps
}: ITextFieldProps) => {
  const [fieldProps, metaProps] = useField({
    name: textInputProps.name,
    type: textInputProps.type,
  });
  const [focused, setFocused] = useState(false);
  const showError = useShowErrors(textInputProps.name);
  const showErrorOutline = showError && !focused;
  const textFieldRef = useRef<HTMLInputElement>(null);

  useFocusFirstError(metaProps.error, textFieldRef);

  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    setFocused(false);
    fieldProps.onBlur(e);
  };

  const textInput = (
    <TextInput
      {...fieldProps}
      data-testid={textInputProps.id}
      value={fieldProps.value || ""}
      validationStatus={showErrorOutline ? "error" : undefined}
      onFocus={() => setFocused(true)}
      onBlur={handleBlur}
      id={textInputProps.id ? textInputProps.id : textInputProps.name}
      {...textInputProps}
      inputRef={textFieldRef}
    />
  );

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
      {inputSuffix || inputPrefix ? (
        <div
          className={classnames("usa-input-group", {
            "usa-input-group--error": showErrorOutline,
            "is-focused": focused,
          })}
          data-testid={`${textInputProps.name}-input-group`}
        >
          {inputPrefix && <InputPrefix>{inputPrefix}</InputPrefix>}
          {textInput}
          {inputSuffix && <InputSuffix>{inputSuffix}</InputSuffix>}
        </div>
      ) : (
        textInput
      )}
      <div className="usa-hint" id={`${textInputProps.name}-hint`}>
        {hint}
      </div>
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
      {fieldAddon ? fieldAddon : null}
    </FormGroup>
  );
};

export default TextField;
