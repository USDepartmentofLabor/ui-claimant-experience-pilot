import { useTranslation } from "react-i18next";

interface IEmployerReviewProps {
  employer: EmployerType;
}

export const EmployerProfileReview = ({ employer }: IEmployerReviewProps) => {
  const { t } = useTranslation("common");

  return (
    <div className="employer-review">
      <h2 className="margin-bottom-0">{employer.name}</h2>
      <div className="employer-address">
        <div>{employer.address.address1}</div>
        {employer.address.address2 && <div>{employer.address.address2}</div>}
        <div>
          {employer.address.city}, {employer.address.state},{" "}
          {employer.address.zipcode}
        </div>
        <div>
          {employer.phones.map((phone, idx) => (
            <span key={`phone-${idx}`}>{phone.number}</span>
          ))}
        </div>
      </div>
      <div>
        {t("start_date")}: {employer.first_work_date}
      </div>
      <div>
        {t("end_date")}: {employer.last_work_date}
      </div>
    </div>
  );
};
