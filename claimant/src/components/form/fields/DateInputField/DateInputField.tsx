import {
  DateInput,
  ErrorMessage,
  FormGroup,
  Fieldset,
} from "@trussworks/react-uswds";
import { useField } from "formik";
import {
  ChangeEventHandler,
  ComponentProps,
  FocusEventHandler,
  KeyboardEventHandler,
  ReactNode,
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
  | "id"
  | "name"
  | "label"
  | "minLength"
  | "maxLength"
  | "unit"
  | "onBlur"
  | "readOnly"
  | "disabled"
>;

type DateFieldProps = {
  id: string;
  name: string;
  hint?: string;
  readOnly?: boolean;
  disabled?: boolean;
  monthProps?: DateInputProps;
  dayProps?: DateInputProps;
  yearProps?: DateInputProps;
  legend?: ReactNode;
  legendSrOnly?: boolean;
};

const MONTH_MAX_LENGTH = 2;
const DAY_MAX_LENGTH = 2;
const YEAR_MAX_LENGTH = 4;
const BACKSPACE = "Backspace";
const VALID_KEYS_REGEXP = /[0-9/]+/;
const INPUT_VALUE_REGEXP = /^\d{0,4}-\d{0,2}-\d{0,2}$/;

export const DateInputField = ({
  id,
  name,
  hint,
  readOnly,
  disabled,
  monthProps,
  dayProps,
  yearProps,
  legend,
  legendSrOnly,
}: DateFieldProps) => {
  const { t } = useTranslation("common");
  const [fieldProps, metaProps, fieldHelperProps] = useField<
    string | undefined
  >(name);

  const parsedInitialValue = useMemo(() => {
    if (
      metaProps.initialValue &&
      INPUT_VALUE_REGEXP.test(metaProps.initialValue)
    ) {
      const parts = metaProps.initialValue.split("-");
      return { month: parts[1], day: parts[2], year: parts[0] };
    } else {
      return { month: "", day: "", year: "" };
    }
  }, [metaProps.initialValue]);

  const [month, setMonth] = useState<string>(() => parsedInitialValue.month);
  const [day, setDay] = useState<string>(() => parsedInitialValue.day);
  const [year, setYear] = useState<string>(() => parsedInitialValue.year);

  const isMounted = useRef(false);
  const dateDivRef = useRef<HTMLDivElement>(null);

  const monthInputRef = useRef<HTMLInputElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

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

    // Automatically proceed to day input when the month field is filled
    if (e.target.value.length === MONTH_MAX_LENGTH) {
      dayInputRef.current?.focus();
    }
  };

  const handleDayChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setDay(e.currentTarget.value);
    if (dayProps?.onChange) {
      dayProps.onChange(e);
    }

    // Automatically proceed to year input when the day field is filled
    if (e.target.value.length === DAY_MAX_LENGTH) {
      yearInputRef.current?.focus();
    }
  };

  const handleYearChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setYear(e.currentTarget.value);
    if (yearProps?.onChange) {
      yearProps.onChange(e);
    }
  };

  const handleDayKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Pressing Backspace on an empty day input focuses the month input
    if (e.currentTarget.value.length === 0 && e.key === BACKSPACE) {
      monthInputRef.current?.focus();
    }
  };

  const handleYearKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    // Pressing Backspace on an empty year input focuses the day input
    if (e.currentTarget.value.length === 0 && e.key === BACKSPACE) {
      dayInputRef.current?.focus();
    }
  };

  const handleKeyPress: KeyboardEventHandler<HTMLInputElement> = (e) => {
    // ReactUSWDS sets input type to "text" for DateInputs.
    // This cannot be overridden (without publishing a breaking release to ReactUSWDS), so for now...
    if (!VALID_KEYS_REGEXP.test(e.key)) {
      e.preventDefault();
    }
  };

  const showError = useShowErrors(name);

  return (
    <FormGroup error={showError}>
      <Fieldset
        className={styles.noTopMarginLegend}
        legend={
          showError ? (
            <span className="usa-label--error">{legend}</span>
          ) : (
            legend
          )
        }
        legendSrOnly={legendSrOnly}
      >
        {hint && (
          <span className="usa-hint" id={`${id}.hint`}>
            {hint}
          </span>
        )}
        <div
          id={id}
          className="usa-memorable-date"
          ref={dateDivRef}
          data-testid={`${name}.parent-div`}
        >
          <DateInput
            id={`${id}.month`}
            name={`${name}.month`}
            value={month}
            label={t("date.month.label")}
            unit={"month"}
            minLength={2}
            maxLength={MONTH_MAX_LENGTH}
            onBlur={handleBlur}
            readOnly={readOnly}
            disabled={disabled}
            inputRef={monthInputRef}
            onKeyPress={handleKeyPress}
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
            maxLength={DAY_MAX_LENGTH}
            onBlur={handleBlur}
            readOnly={readOnly}
            disabled={disabled}
            inputRef={dayInputRef}
            onKeyDown={handleDayKeydown}
            onKeyPress={handleKeyPress}
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
            maxLength={YEAR_MAX_LENGTH}
            onBlur={handleBlur}
            readOnly={readOnly}
            disabled={disabled}
            inputRef={yearInputRef}
            onKeyDown={handleYearKeydown}
            onKeyPress={handleKeyPress}
            {...yearProps}
            onChange={handleYearChange}
          />
        </div>
        {showError && <ErrorMessage>{metaProps.error}</ErrorMessage>}
      </Fieldset>
    </FormGroup>
  );
};
