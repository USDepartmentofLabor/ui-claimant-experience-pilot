import { ReactNode } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  ErrorMessage,
  DatePicker as USWDSDatePicker,
} from "@trussworks/react-uswds";

type DatePickerProps = React.ComponentProps<typeof USWDSDatePicker>;

interface IDatePickerProps extends DatePickerProps {
  id: string;
  name: string;
  label: ReactNode;
}

export const DatePicker = ({
  id,
  name,
  label,
  onChange,
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
        {...fieldProps}
        id={id}
        name={name}
        aria-describedby={`${id}-label ${id}-hint`}
        onChange={onChange}
        {...inputProps}
      />
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
