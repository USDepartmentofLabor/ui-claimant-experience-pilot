import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { OtherPayInformationPage } from "../OtherPayInformation/OtherPayInformation";
import claimForm from "../../../i18n/en/claimForm";

type PayTypeOption = {
  value: string;
  translationKey: keyof typeof claimForm.other_pay_detail.pay_type.options;
};

export const OtherPayReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "other_pay_detail" });
  const { values } = useFormikContext<OtherPayType>();

  return (
    <ReviewSection pageDefinition={OtherPayInformationPage}>
      {values.LOCAL_pay_types && (
        <ReviewElement
          title={t("pay_type.label")}
          text={values.LOCAL_pay_types.map((local_pay_option) =>
            t(
              `pay_type.options.${
                local_pay_option as PayTypeOption["translationKey"]
              }.label`
            )
          ).join(", ")}
        />
      )}
      {values.other_pay &&
        values.other_pay.map((otherPay, idx) => (
          <>
            <ReviewElement
              key={`other-pay-total-${idx}`}
              title={t("total.label", {
                payType: t(
                  `pay_type.options.${
                    otherPay.pay_type as PayTypeOption["translationKey"]
                  }.description`
                ),
              })}
              text={`$${(otherPay.total || "0.00")
                .toString()
                .replace(/^\$/, "")}`}
            />
            {otherPay.date_received && (
              <ReviewElement
                key={`other-pay-date-received-${idx}`}
                title={t("date_received.label", {
                  payType: t(
                    `pay_type.options.${
                      otherPay.pay_type as PayTypeOption["translationKey"]
                    }.description`
                  ),
                })}
                text={otherPay.date_received}
              />
            )}
            {otherPay.note && (
              <ReviewElement
                key={`other-pay-desc-${idx}`}
                title={t("note.label", {
                  payType: t(
                    `pay_type.options.${
                      otherPay.pay_type as PayTypeOption["translationKey"]
                    }.description`
                  ),
                })}
                text={otherPay.note}
              />
            )}
          </>
        ))}
    </ReviewSection>
  );
};
