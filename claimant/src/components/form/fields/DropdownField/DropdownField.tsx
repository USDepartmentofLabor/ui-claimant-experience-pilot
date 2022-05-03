import React, { useRef } from "react";
import { useField } from "formik";
import {
  FormGroup,
  Label,
  Dropdown,
  ErrorMessage,
} from "@trussworks/react-uswds";
import { useTranslation } from "react-i18next";
import { useShowErrors } from "../../../../hooks/useShowErrors";
import { useFocusFirstError } from "../../../../hooks/useFocusFirstError";

type DropdownOption = {
  label: string;
  value: string;
};

const EMPTY_OPTION_VALUE = "";

type DropdownProps = Omit<
  React.ComponentProps<typeof Dropdown>,
  "id" | "children"
>;

interface IDropdownFieldProps extends DropdownProps {
  label: React.ReactNode;
  labelClassName?: string;
  labelHint?: string;
  options: DropdownOption[];
  startEmpty?: boolean;
}
/**
 * This component renders a ReactUSWDS Dropdown component inside of a FormGroup,
 * with a Label and ErrorMessage.
 *
 * It relies on the Formik useField hook to work, so it must ALWAYS be rendered
 * inside of a Formik form context.
 *
 * If you want to use these components outside a Formik form, you can use the
 * ReactUSWDS components directly.
 */

const DropdownField = ({
  name,
  label,
  labelClassName,
  labelHint,
  options,
  startEmpty,
  ...inputProps
}: IDropdownFieldProps) => {
  const { t } = useTranslation("common");
  const [fieldProps, metaProps] = useField({ name });
  const showError = useShowErrors(name);
  const selectRef = useRef<HTMLSelectElement>(null);

  useFocusFirstError(metaProps.error, selectRef);

  if (startEmpty && options[0].value !== EMPTY_OPTION_VALUE) {
    options.unshift({ value: EMPTY_OPTION_VALUE, label: t("select_one") });
  }

  return (
    <FormGroup error={showError}>
      <Label
        className={labelClassName}
        hint={labelHint}
        error={showError}
        htmlFor={name}
      >
        {label}
      </Label>

      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <Dropdown
        id={name}
        data-testid={name}
        {...fieldProps}
        {...inputProps}
        inputRef={selectRef}
      >
        {options &&
          options.map(({ label, value }, index) => (
            <option key={`${index}_${label}_${value}`} value={value}>
              {label}
            </option>
          ))}
      </Dropdown>

      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};

export default DropdownField;
