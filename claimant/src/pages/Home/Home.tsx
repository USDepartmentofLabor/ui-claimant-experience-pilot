import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";
import { useWhoAmI } from "../../queries/whoami";
import PageLoader from "../../common/PageLoader";
// import homeStyles from "./Home.module.scss";

// HomePage == /claimant/

// notional for now, till we have info architecture for site
// via App.tsx the routing just skips this page currently.
const HomePage = () => {
  const { t } = useTranslation("home");
  const { data: whoami, isLoading, error } = useWhoAmI();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !whoami) {
    throw error;
  }

  return (
    <main>
      <RequestErrorBoundary>
        <h1>{t("welcome")}</h1>
        <p className="usa-intro">{t("intro")}</p>
      </RequestErrorBoundary>
    </main>
  );
};

export default HomePage;
