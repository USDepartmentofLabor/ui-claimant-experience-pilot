import dayjs from "dayjs";
import { DateInput, ErrorMessage, FormGroup } from "@trussworks/react-uswds";
import { useField } from "formik";
import {
  ChangeEventHandler,
  ComponentProps,
  FocusEventHandler,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useShowErrors } from "../../../../hooks/useShowErrors";
import styles from "./DateInputField.module.scss";

type DateInputProps = Omit<
  ComponentProps<typeof DateInput>,
  "id" | "name" | "label" | "minLength" | "maxLength" | "unit" | "onBlur"
>;

type DateFieldProps = {
  id: string;
  name: string;
  hint?: string;
  monthProps?: DateInputProps;
  dayProps?: DateInputProps;
  yearProps?: DateInputProps;
};

export const DateInputField = ({
  id,
  name,
  hint,
  monthProps,
  dayProps,
  yearProps,
}: DateFieldProps) => {
  const { t } = useTranslation("common");
  const [fieldProps, metaProps, fieldHelperProps] = useField<
    string | undefined
  >(name);

  const initialValue = useMemo(
    () => (metaProps.initialValue === "" ? "" : dayjs(metaProps.initialValue)),
    [metaProps.initialValue]
  );

  const [month, setMonth] = useState<string>(() =>
    initialValue === "" ? "" : (initialValue.month() + 1).toString()
  );
  const [day, setDay] = useState<string>(() =>
    initialValue === "" ? "" : initialValue.date().toString()
  );
  const [year, setYear] = useState<string>(() =>
    initialValue === "" ? "" : initialValue.year().toString()
  );

  const isMounted = useRef(false);
  const dateDivRef = useRef<HTMLDivElement>(null);

  const updateFormik = () => {
    const inputValue = day || month || year ? `${year}-${month}-${day}` : "";

    fieldHelperProps.setValue(inputValue);
  };

  // Update formik value when state values change.
  useEffect(() => {
    if (isMounted.current) {
      updateFormik();
    } else {
      isMounted.current = true;
    }
  }, [month, day, year]);

  // Blur the formik field when the target of the blur event is not part of this component
  const handleBlur: FocusEventHandler<HTMLInputElement> = (e) => {
    const { relatedTarget: newTarget } = e;
    if (!dateDivRef.current?.contains(newTarget)) {
      fieldProps.onBlur(e);
    }
  };

  const handleMonthChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setMonth(e.target.value);
    if (monthProps?.onChange) {
      monthProps.onChange(e);
    }
  };

  const handleDayChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setDay(e.currentTarget.value);
    if (dayProps?.onChange) {
      dayProps.onChange(e);
    }
  };

  const handleYearChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setYear(e.currentTarget.value);
    if (yearProps?.onChange) {
      yearProps.onChange(e);
    }
  };

  const showError = useShowErrors(name);

  return (
    <FormGroup error={showError} className={styles.noMargin}>
      {hint && (
        <span className="usa-hint" id={`${id}.hint`}>
          {hint}
        </span>
      )}
      <div className="usa-memorable-date" ref={dateDivRef}>
        <DateInput
          id={`${id}.month`}
          name={`${name}.month`}
          value={month}
          label={t("date.month.label")}
          unit={"month"}
          minLength={2}
          maxLength={2}
          onBlur={handleBlur}
          {...monthProps}
          onChange={handleMonthChange}
        />
        <DateInput
          id={`${id}.day`}
          name={`${name}.day`}
          value={day}
          label={t("date.day.label")}
          unit={"day"}
          minLength={2}
          maxLength={2}
          onBlur={handleBlur}
          {...dayProps}
          onChange={handleDayChange}
        />
        <DateInput
          id={`${id}.year`}
          name={`${name}.year`}
          value={year}
          label={t("date.year.label")}
          unit={"year"}
          minLength={4}
          maxLength={4}
          onBlur={handleBlur}
          {...yearProps}
          onChange={handleYearChange}
        />
      </div>
      {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
    </FormGroup>
  );
};
