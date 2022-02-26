import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useWhoAmI } from "../../queries/whoami";
import { useTranslation } from "react-i18next";

import PageLoader from "../../common/PageLoader";

export const WhoAmI = () => {
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
      <li>{t("info.firstName", { firstName: whoami.first_name })}</li>
      <li>{t("info.lastName", { lastName: whoami.last_name })}</li>
      <li>{t("info.dob", { dob: whoami.birthdate })}</li>
      <li>{t("info.email", { email: whoami.email })}</li>
      <li>{t("info.ssn", { ssn: whoami.ssn })}</li>
      <li>{t("info.phone", { phone: whoami.phone })}</li>
      <li>{t("info.address1", { address1: whoami.address?.address1 })}</li>
      <li>{t("info.address2", { address2: whoami.address?.address2 })}</li>
      <li>{t("info.city", { city: whoami.address?.city })}</li>
      <li>{t("info.state", { state: whoami.address?.state })}</li>
      <li>{t("info.zipcode", { zipcode: whoami.address?.zipcode })}</li>
      <li>{t("info.SWA", { SWA: whoami.swa?.code })}</li>
      <li>{t("info.SWAName", { SWAName: whoami.swa?.name })}</li>
      <li>
        {t("info.SWAClaimantUrl", { SWAClaimantUrl: whoami.swa?.claimant_url })}
      </li>
      <li>{t("info.claim", { claim: whoami.claim_id })}</li>
    </ul>
  );
};

const WhoAmIPage = () => {
  const { t } = useTranslation("whoami");
  return (
    <main id="main-content" data-testid="who-am-i-page">
      <h1>{t("heading")}</h1>
      <p className="usa-intro">{t("intro")}</p>
      <RequestErrorBoundary>
        <WhoAmI />
      </RequestErrorBoundary>
    </main>
  );
};

export default WhoAmIPage;
