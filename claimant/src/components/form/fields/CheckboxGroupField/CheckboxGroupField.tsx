import { ComponentProps, ReactNode } from "react";
import { FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import { useField } from "formik";

import CheckboxField from "../CheckboxField/CheckboxField";

type CheckboxOption = {
  value: string;
  label: ReactNode;
  checkboxProps?: Omit<
    ComponentProps<typeof CheckboxField>,
    "id" | "name" | "value" | "label"
  >;
};

interface ICheckBoxGroupFieldProps {
  id: string;
  name: string;
  options: CheckboxOption[];
}

export const CheckboxGroupField = ({
  id,
  name,
  options,
}: ICheckBoxGroupFieldProps) => {
  const [fieldProps, metaProps] = useField(name);
  const showError = metaProps.touched && !!metaProps.error;

  return (
    <FormGroup error={showError}>
      {options.map((option, index) => (
        <CheckboxField
          {...fieldProps}
          key={`${id}.${index}.${option.value}`}
          id={`${id}.${option.value}`}
          name={name}
          label={option.label}
          value={option.value}
          checked={fieldProps.value.includes(option.value)}
          {...option.checkboxProps}
        />
      ))}
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
