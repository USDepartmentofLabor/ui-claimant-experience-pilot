import { TextField } from "../TextField/TextField";
import {
  ChangeEventHandler,
  ComponentProps,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { useField } from "formik";
import {
  convertCentsToDollars,
  convertDollarsToCents,
  CURRENCY_REGEX,
} from "../../../../utils/currencyFormat";

type TextFieldProps = Optional<
  Omit<ComponentProps<typeof TextField>, "type">,
  "id"
>;

interface CurrencyFieldProps extends TextFieldProps {
  name: string;
  label: string;
  inputPrefix?: ReactNode;
}

const CurrencyField = ({
  id,
  name,
  label,
  inputPrefix = "$",
  ...inputProps
}: CurrencyFieldProps) => {
  const [fieldProps, metaProps, fieldHelperProps] = useField<
    string | undefined
  >(name);

  const isMounted = useRef(false);
  const [dollarValue, setDollarValue] = useState<string>(() =>
    metaProps.initialValue ? convertCentsToDollars(metaProps.initialValue) : ""
  );

  useEffect(() => {
    // prevent unnecessary calculation on initial mount
    if (isMounted.current) {
      const getFormikValue = () => {
        if (!dollarValue) {
          return "";
        }
        if (dollarValue.match(CURRENCY_REGEX)) {
          return convertDollarsToCents(dollarValue);
        }
        // don't set to fixed value so that validation can apply
        return String(Number(dollarValue) * 100);
      };
      fieldHelperProps.setValue(getFormikValue());
    } else {
      isMounted.current = true;
    }
  }, [dollarValue]);

  const handleFieldChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setDollarValue(e.target.value);
    if (inputProps?.onChange) {
      inputProps.onChange(e);
    }
  };

  return (
    <TextField
      {...fieldProps}
      id={id || name}
      label={label}
      name={name}
      type="text"
      value={dollarValue}
      inputPrefix={inputPrefix}
      {...inputProps}
      onChange={handleFieldChange}
    />
  );
};

export default CurrencyField;
