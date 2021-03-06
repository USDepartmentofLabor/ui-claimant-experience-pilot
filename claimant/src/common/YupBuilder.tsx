import { TFunction } from "react-i18next";
import * as yup from "yup";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ISO_8601_DATE, USER_FACING_DATE_INPUT_FORMAT } from "../utils/format";
import { CENTS_REGEX } from "../utils/currencyFormat";
import states from "../fixtures/states.json";

// TODO setLocale to customize min/max/matches errors
// https://github.com/jquense/yup#error-message-customization

export const yupPhone = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    number: yup
      .string()
      .matches(
        /[(]?\d{3}[)]?[-\s.]?\d{3}[-\s.]?\d{4}/,
        t("phone.number.matches")
      )
      .min(10)
      .max(32)
      .required(t("phone.number.required")),
    type: yup.string(),
    sms: yup.boolean(),
  });

export const yupName = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    first_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.first_name.required")),
    last_name: yup
      .string()
      .nullable()
      .max(36)
      .required(t("name.last_name.required")),
    middle_name: yup.string().nullable().max(36),
  });

export const yupAddress = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    address1: yup.string().max(64).required(t("address.address1.required")),
    address2: yup.string().max(64),
    city: yup.string().max(64).required(t("address.city.required")),
    state: yup
      .string()
      .oneOf(Object.keys(states))
      .required(t("address.state.required")),
    zipcode: yup
      .string()
      .matches(/^\d{5}(-\d{4})?$/, t("address.zipcode.format"))
      .required(t("address.zipcode.required")),
  });

export const yupDate = (t: TFunction<"claimForm">, fieldName: string) =>
  yup
    .date()
    .transform((value, originalValue) => {
      dayjs.extend(customParseFormat);
      return dayjs(originalValue, ISO_8601_DATE, true).isValid()
        ? value
        : yup.date.INVALID_DATE;
    })
    .typeError(
      t("date.typeError", {
        fieldName,
        dateFormat: USER_FACING_DATE_INPUT_FORMAT,
      })
    )
    .required(t("date.required", { fieldName }));

export const yupCurrency = (errorMsg = "") => {
  return yup.string().matches(CENTS_REGEX, errorMsg);
};
