import { RequestErrorBoundary } from "../queries/RequestErrorBoundary";
import { useWhoAmI } from "../queries/whoami";
import { useTranslation } from "react-i18next";

import PageLoader from "../common/PageLoader";

const WhoAmI = () => {
  const { data: whoami, isLoading, error } = useWhoAmI();
  const { t } = useTranslation("whoami");

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !whoami) {
    throw error;
  }

  return (
    <ul className="usa-list">
      <li>{t("info.formId", { formId: whoami.form_id })}</li>
      <li>{t("info.firstName", { firstName: whoami.first_name })}</li>
      <li>{t("info.lastName", { lastName: whoami.last_name })}</li>
      <li>{t("info.dob", { dob: whoami.birthdate })}</li>
      <li>{t("info.email", { email: whoami.email })}</li>
      <li>{t("info.ssn", { ssn: whoami.ssn })}</li>
      <li>{t("info.phone", { phone: whoami.phone })}</li>
    </ul>
  );
};

const WhoAmIPage = () => {
  const { t } = useTranslation("whoami");
  return (
    <main>
      <h1>{t("heading")}</h1>
      <p className="usa-intro">{t("intro")}</p>
      <RequestErrorBoundary>
        <WhoAmI />
      </RequestErrorBoundary>
    </main>
  );
};

export default WhoAmIPage;
