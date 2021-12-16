import React from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  ErrorMessage,
  DatePicker as USWDSDatePicker,
} from "@trussworks/react-uswds";

interface IDatePickerProps {
  id: string;
  name: string;
  label: React.ReactNode;
}

export const DatePicker = ({
  id,
  name,
  label,
  ...inputProps
}: IDatePickerProps) => {
  const [fieldProps, metaProps] = useField(name);
  const showError = metaProps.touched && !!metaProps.error;

  return (
    <FormGroup error={showError}>
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      <div className="usa-hint" id={`${id}-hint`}>
        mm/dd/yyyy
      </div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <USWDSDatePicker
        id={id}
        aria-describedby={`${id}-label ${id}-hint`}
        {...fieldProps}
        {...inputProps}
      />
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
