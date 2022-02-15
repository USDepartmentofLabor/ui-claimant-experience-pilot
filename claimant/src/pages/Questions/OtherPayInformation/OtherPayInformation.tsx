import * as yup from "yup";

import { IPageDefinition } from "../../PageDefinitions";
import OtherPay from "../../../components/form/OtherPay/OtherPay";
import { TFunction } from "react-i18next";

import { payTypeOptions } from "../../../components/form/OtherPay/OtherPay";
const OtherPayInformation = () => {
  return <OtherPay />;
};

export default OtherPayInformation;

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object({
    other_pay: yup.array().of(
      yup.object({
        pay_type: yup.mixed().oneOf(payTypeOptions.map(({ value }) => value)),
        total: yup
          .number()
          .typeError(t("other_pay_detail.total.errors.number"))
          .min(0, "other_pay_detail.total.errors.min")
          .required(t("other_pay_detail.total.errors.required")),
        date_received: yup
          .date()
          .max(new Date(), t("other_pay_detail.date_received.errors.max"))
          .required(t("other_pay_detail.date_received.errors.required")),
        note: yup.mixed().required(t("other_pay_detail.note.errors.required")),
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
