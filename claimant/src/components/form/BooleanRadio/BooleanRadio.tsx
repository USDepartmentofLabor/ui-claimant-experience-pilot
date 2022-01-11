import { useField } from "formik";
import { Radio, FormGroup, ErrorMessage } from "@trussworks/react-uswds";
import { ChangeEvent, ChangeEventHandler } from "react";
import { useTranslation } from "react-i18next";
import styles from "./BooleanRadio.module.scss";

interface IBooleanRadioProps {
  id: string;
  name: string;
  yesLabel?: string;
  noLabel?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const BooleanRadio = ({
  id,
  name,
  yesLabel,
  noLabel,
  onChange,
  ...inputProps
}: IBooleanRadioProps & JSX.IntrinsicElements["input"]) => {
  const { t } = useTranslation("common");
  const [fieldProps, metaProps, fieldHelperProps] = useField(name);
  const showError = metaProps.touched && !!metaProps.error;

  const convertValueToBoolean = (value: string): boolean | undefined => {
    return value === "" ? undefined : value === "yes";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldHelperProps.setValue(convertValueToBoolean(e.target.value), false);
    fieldHelperProps.setTouched(true, false);
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <FormGroup error={showError}>
      <Radio
        {...fieldProps}
        key={`${id}.0.yes`}
        id={`${id}.yes`}
        name={name}
        label={yesLabel || t("yes")}
        value={"yes"}
        checked={metaProps.value === true}
        onChange={handleChange}
        className={styles.inline}
        {...inputProps}
      />
      <Radio
        {...fieldProps}
        key={`${id}.0.no`}
        id={`${id}.no`}
        name={name}
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
