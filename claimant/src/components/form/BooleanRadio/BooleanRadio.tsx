import { useField } from "formik";
import { Radio, FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import { ChangeEvent, ChangeEventHandler, useRef } from "react";
import { useTranslation } from "react-i18next";
import styles from "./BooleanRadio.module.scss";
import { useShowErrors } from "../../../hooks/useShowErrors";
import { useFocusFirstError } from "../../../hooks/useFocusFirstError";

interface IBooleanRadioProps {
  id?: string;
  name: string;
  yesLabel?: string;
  noLabel?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const BooleanRadio = ({
  id: idProp,
  name,
  yesLabel,
  noLabel,
  onChange,
  ...inputProps
}: IBooleanRadioProps & JSX.IntrinsicElements["input"]) => {
  const { t } = useTranslation("common");
  const [fieldProps, metaProps, fieldHelperProps] = useField(name);
  const showError = useShowErrors(name);
  const radioRef = useRef<HTMLInputElement>(null);

  useFocusFirstError(metaProps.error, radioRef);

  const convertValueToBoolean = (value: string): boolean | undefined => {
    return value === "" ? undefined : value === "yes";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldHelperProps.setValue(convertValueToBoolean(e.target.value));
    fieldHelperProps.setTouched(true, false);
    if (onChange) {
      onChange(e);
    }
  };

  const id = idProp || name;

  return (
    <FormGroup error={showError}>
      <Radio
        {...fieldProps}
        key={`${id}.0.yes`}
        id={`${id}.yes`}
        data-testid={`${id}.yes`}
        label={yesLabel || t("yes")}
        value={"yes"}
        checked={metaProps.value === true}
        onChange={handleChange}
        className={styles.inline}
        {...inputProps}
        inputRef={radioRef}
      />
      <Radio
        {...fieldProps}
        key={`${id}.0.no`}
        id={`${id}.no`}
        data-testid={`${id}.no`}
        label={noLabel || t("no")}
        value={"no"}
        checked={metaProps.value === false}
        onChange={handleChange}
        className={styles.inline}
        {...inputProps}
      />
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
