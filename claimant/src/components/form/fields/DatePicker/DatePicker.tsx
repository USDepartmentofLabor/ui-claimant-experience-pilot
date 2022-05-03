import { ComponentProps, ReactNode } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  ErrorMessage,
  DatePicker as USWDSDatePicker,
} from "@trussworks/react-uswds";
import { useShowErrors } from "../../../../hooks/useShowErrors";
import { useFocusFirstErrorById } from "../../../../hooks/useFocusFirstError";

type DatePickerProps = Omit<ComponentProps<typeof USWDSDatePicker>, "id">;

interface IDatePickerProps extends DatePickerProps {
  name: string;
  label: ReactNode;
}

export const DatePicker = ({
  name,
  label,
  onChange,
  ...inputProps
}: IDatePickerProps) => {
  const [fieldProps, metaProps] = useField(name);
  const showError = useShowErrors(name);

  useFocusFirstErrorById(metaProps.error, name);

  return (
    <FormGroup error={showError}>
      <Label id={`${name}-label`} htmlFor={name}>
        {label}
      </Label>
      <div className="usa-hint" id={`${name}-hint`}>
        mm/dd/yyyy
      </div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <USWDSDatePicker
        key={name}
        {...fieldProps}
        id={name}
        name={name}
        aria-describedby={`${name}-label ${name}-hint`}
        onChange={onChange}
        {...inputProps}
      />
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
