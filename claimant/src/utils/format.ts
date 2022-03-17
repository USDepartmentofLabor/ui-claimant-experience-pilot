import dayjs from "dayjs";

export const ISO_8601_DATE = "YYYY-MM-DD";
export const USER_FACING_DATE_INPUT_FORMAT = "MM-DD-YYYY";
export const DATE_TIME_FORMAT = "MMMM D, YYYY hh:mm:ss a";
export const DATE_FORMAT = "MMMM D, YYYY";
export const EXPIRES_AT_FORMAT = "MMMM D";

export const formatUserInputDate = (
  initialValue?: string
): string | undefined => {
  if (!initialValue) return undefined;

  const dayjsValue = dayjs(initialValue);
  return initialValue && dayjsValue.isValid()
    ? dayjsValue.format(ISO_8601_DATE)
    : initialValue; // preserve undefined to show validations later
};

export const formatISODateTimeString = (datetime: string): string => {
  const dayjsValue = dayjs(datetime);
  // TODO i18n
  return dayjsValue.format(DATE_TIME_FORMAT);
};

export const formatDate = (datetime: string): string => {
  const dayjsValue = dayjs(datetime);
  return dayjsValue.format(DATE_FORMAT);
};

export const formatExpiresAtDate = (date: string): string => {
  const dayjsValue = dayjs(date);
  return dayjsValue.format(EXPIRES_AT_FORMAT);
};

export const addressToString = (address: AddressType) => {
  const { address1, address2, city, state, zipcode } = address;
  return [address1, address2, city, `${state} ${zipcode}`]
    .filter((el) => !!el)
    .join(", ");
};

export const centsRegex = /^[1-9][0-9]+$/;
export const currencyRegex = /^[0-9]+(\.[0-9][0-9])?$/;
