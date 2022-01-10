import { useField } from "formik";
import { Radio, FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import { ChangeEvent, ChangeEventHandler, ReactNode } from "react";

interface IRadioOption {
  label: ReactNode;
  value: string;
}

type RadioInputProps = Omit<
  React.ComponentProps<typeof Radio>,
  "label" | "value"
>;

interface IRadioFieldProps extends RadioInputProps {
  id: string;
  name: string;
  options: IRadioOption[];
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const RadioField = ({
  id,
  name,
  options,
  onChange,
  ...inputProps
}: IRadioFieldProps & JSX.IntrinsicElements["input"]) => {
  const [fieldProps, metaProps] = useField(name);
  const showError = metaProps.touched && !!metaProps.error;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldProps.onChange(e);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <FormGroup error={showError}>
      {options.map((option, index) => (
        <Radio
          {...fieldProps}
          key={`${id}.${index}.${option.value}`}
          id={`${id}.${option.value}`}
          data-testid={`${id}.${option.value}`}
          label={option.label}
          value={option.value}
          checked={metaProps.value === option.value}
          onChange={handleChange}
          {...inputProps}
        />
      ))}

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
