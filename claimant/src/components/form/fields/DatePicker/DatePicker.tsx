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

type DatePickerProps = Optional<ComponentProps<typeof USWDSDatePicker>, "id">;

interface IDatePickerProps extends DatePickerProps {
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
  const showError = useShowErrors(name);

  const resolvedId = id || name;

  useFocusFirstErrorById(metaProps.error, resolvedId);

  return (
    <FormGroup error={showError}>
      <Label id={`${resolvedId}-label`} htmlFor={resolvedId}>
        {label}
      </Label>
      <div className="usa-hint" id={`${resolvedId}-hint`}>
        mm/dd/yyyy
      </div>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <USWDSDatePicker
        key={resolvedId}
        {...fieldProps}
        id={resolvedId}
        name={name}
        aria-describedby={`${resolvedId}-label ${resolvedId}-hint`}
        onChange={onChange}
        {...inputProps}
      />
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
