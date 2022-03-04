import { useTranslation } from "react-i18next";
import { ReviewElement } from "./ReviewSection";

export const YesNoReview = ({
  title,
  value,
}: {
  title: string;
  value: boolean | undefined;
}) => {
  const { t: t } = useTranslation("common");
  return value !== undefined ? (
    <ReviewElement title={title} text={t(value ? "yes" : "no")} />
  ) : (
    <></>
  );
};

export const PhoneReview = ({ phone }: { phone: PhoneType }) => {
  const { t } = useTranslation("common");
  return (
    <>
      <ReviewElement title={t("phone.number.label")} text={phone.number} />
      {phone.type && (
        <ReviewElement
          title={t("phone.type.label")}
          text={t(`phone.${phone.type}`)}
        />
      )}
      <YesNoReview title={t("phone.sms.label")} value={phone.sms} />
    </>
  );
};
