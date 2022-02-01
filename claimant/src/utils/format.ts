import dayjs from "dayjs";

export const ISO_8601_DATE = "YYYY-MM-DD";
export const USER_FACING_DATE_INPUT_FORMAT = "MM-DD-YYYY";

export const formatUserInputDate = (
  initialValue?: string
): string | undefined => {
  if (!initialValue) return undefined;

  const dayjsValue = dayjs(initialValue);
  return initialValue && dayjsValue.isValid()
    ? dayjsValue.format(ISO_8601_DATE)
    : initialValue; // preserve undefined to show validations later
};

export const addressToString = (address: AddressType) => {
  const { address1, address2, city, state, zipcode } = address;
  return [address1, address2, city, `${state} ${zipcode}`]
    .filter((el) => !!el)
    .join(", ");
};
