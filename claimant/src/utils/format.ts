import dayjs from "dayjs";

export const formatUserInputDate = (
  initialValue?: string
): string | undefined => {
  if (!initialValue) return undefined;

  const dayjsValue = dayjs(initialValue);
  return initialValue && dayjsValue.isValid()
    ? dayjsValue.format("YYYY-MM-DD")
    : initialValue; // preserve undefined to show validations later
};
