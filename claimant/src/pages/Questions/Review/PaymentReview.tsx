import { useTranslation } from "react-i18next";
import { useFormikContext } from "formik";
import { ReviewElement, ReviewSection } from "./ReviewSection";
import { PaymentInformationPage } from "../PaymentInformation/PaymentInformation";
import { YesNoReview } from "./ReviewHelpers";

export const PaymentReview = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "payment" });
  const { values } = useFormikContext<PaymentInformationType>();

  return (
    <ReviewSection pageDefinition={PaymentInformationPage}>
      <YesNoReview
        title={t("federal_income_tax_withheld.label")}
        value={values.federal_income_tax_withheld}
      />
      {values.payment?.payment_method && (
        <ReviewElement
          title={t("payment_method.label")}
          text={t(`payment_method.options.${values.payment.payment_method}`)}
        />
      )}
      {values.payment?.account_type && (
        <ReviewElement
          title={t("account_type.label")}
          text={t(`account_type.options.${values.payment.account_type}`)}
        />
      )}
      {values.payment?.routing_number && (
        <ReviewElement
          title={t("routing_number.label")}
          text={values.payment.routing_number}
        />
      )}
      {values.payment?.account_number && (
        <ReviewElement
          title={t("account_number.label")}
          text={values.payment.account_number}
        />
      )}
    </ReviewSection>
  );
};
