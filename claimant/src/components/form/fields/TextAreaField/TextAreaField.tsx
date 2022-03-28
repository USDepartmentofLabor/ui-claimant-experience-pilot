import React, { ReactNode, useRef } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  Textarea,
  ErrorMessage,
} from "@trussworks/react-uswds";
import { useShowErrors } from "../../../../hooks/useShowErrors";
import { useFocusFirstError } from "../../../../hooks/useFocusFirstError";

type TextareaProps = React.ComponentProps<typeof Textarea>;

interface ITextAreaFieldProps extends TextareaProps {
  label: ReactNode;
  labelClassName?: string;
  labelHint?: string;
  hint?: ReactNode;
}

export const TextAreaField = ({
  label,
  labelClassName,
  labelHint,
  hint,
  ...textareaProps
}: ITextAreaFieldProps) => {
  const [fieldProps, metaProps] = useField({
    name: textareaProps.name,
  });
  const showError = useShowErrors(textareaProps.name);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useFocusFirstError(metaProps.error, textareaRef);

  return (
    <FormGroup error={showError}>
      <Label
        error={showError}
        className={labelClassName}
        hint={labelHint}
        htmlFor={textareaProps.id || textareaProps.name}
      >
        {label}
      </Label>

      <div className="usa-hint" id={`${textareaProps.name}-hint`}>
        {hint}
      </div>

      <Textarea
        {...fieldProps}
        value={fieldProps.value || ""}
        {...textareaProps}
        inputRef={textareaRef}
        error={showError}
      />

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default TextAreaField;
