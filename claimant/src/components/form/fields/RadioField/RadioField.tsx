import { useField } from "formik";
import { Radio, FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import {
  ChangeEvent,
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
  useRef,
} from "react";
import { useShowErrors } from "../../../../hooks/useShowErrors";
import { useFocusFirstError } from "../../../../hooks/useFocusFirstError";

interface IRadioOption {
  label: ReactNode;
  value: string;
}

type RadioInputProps = Omit<ComponentProps<typeof Radio>, "label" | "value">;

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
  const showError = useShowErrors(name);
  const radioRef = useRef<HTMLInputElement>(null);

  useFocusFirstError(metaProps.error, radioRef);

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
          inputRef={index === 0 ? radioRef : undefined}
        />
      ))}

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
