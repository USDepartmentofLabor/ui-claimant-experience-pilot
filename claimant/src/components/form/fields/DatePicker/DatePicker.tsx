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
  id: idProp,
  name,
  label,
  onChange,
  ...inputProps
}: IDatePickerProps) => {
  const [fieldProps, metaProps] = useField(name);
  const showError = useShowErrors(name);

  const id = idProp || name;

  useFocusFirstErrorById(metaProps.error, id);

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
        key={id}
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
