export const CURRENCY_REGEX = /^\d+(\.\d{2})?$/;
export const CENTS_REGEX = /^\d{2,}$/;

export const convertCentsToDollars = (cents: string): string =>
  (Number(cents) / 100).toFixed(2);

export const convertDollarsToCents = (dollars: string): string =>
  (Number(dollars) * 100).toFixed();
