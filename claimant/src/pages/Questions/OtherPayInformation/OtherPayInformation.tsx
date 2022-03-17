import * as yup from "yup";
import dayjs from "dayjs";

import { IPageDefinition } from "../../PageDefinitions";
import OtherPay from "../../../components/form/OtherPay/OtherPay";
import { TFunction } from "react-i18next";

import { payTypeOptions } from "../../../components/form/OtherPay/OtherPay";
import { yupCurrency, yupDate } from "../../../common/YupBuilder";

const OtherPayInformation = () => {
  return <OtherPay />;
};

export default OtherPayInformation;

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object({
    LOCAL_pay_types: yup.array().when(["other_pay"], {
      is: (otherPay: OtherPayType["other_pay"]) =>
        !otherPay || !otherPay.length,
      then: yup
        .array()
        .min(1, t("other_pay_detail.pay_type.required"))
        .required(t("other_pay_detail.pay_type.required")),
    }),
    other_pay: yup.array().of(
      yup.object({
        pay_type: yup.mixed().oneOf(payTypeOptions.map(({ value }) => value)),
        total: yupCurrency(t("other_pay_detail.total.errors.number")).when(
          "pay_type",
          {
            is: "no_other_pay",
            otherwise: yup
              .string()
              .required(t("other_pay_detail.total.errors.required")),
          }
        ),
        date_received: yup.date().when("pay_type", {
          is: "no_other_pay",
          otherwise: yupDate(
            t,
            t("other_pay_detail.date_received.errors.label")
          ).max(
            dayjs(new Date()).format("YYYY-MM-DD"),
            t("other_pay_detail.date_received.errors.max")
          ),
        }),
        note: yup.mixed().when("pay_type", {
          is: "no_other_pay",
          otherwise: yup
            .mixed()
            .required(t("other_pay_detail.note.errors.required")),
        }),
      })
    ),
  });

export const OtherPayInformationPage: IPageDefinition = {
  path: "other-pay",
  heading: "other_pay",
  initialValues: {
    other_pay: [],
  },
  Component: OtherPayInformation,
  pageSchema,
};
