import { lazy, Suspense } from "react";

import { Routes, Route, Navigate } from "react-router-dom";

import { ReactQueryDevtools } from "react-query/devtools";

import { GovBanner, Header, GridContainer } from "@trussworks/react-uswds";

const WhoAmIPage = lazy(() => import("./pages/Whoami/Whoami"));
// when we have routing, use this.
// const HomePage = lazy(() => import("./pages/Home/Home"));
const ClaimFormPage = lazy(() => import("./pages/ClaimForm/ClaimForm"));
const ClaimsDashboardPage = lazy(
  () => import("./pages/ClaimsDashboard/ClaimsDashboard")
);
const SuccessPage = lazy(() => import("./pages/Success/Success"));

import { AuthContainer } from "./common/AuthContainer";
import { useTranslation } from "react-i18next";

// These classes are imported globally and can be used on every page
import "./styles.scss";
import "@trussworks/react-uswds/lib/index.css";
import { pages } from "./pages/PageDefinitions";
import PageLoader from "./common/PageLoader";
import { SessionManager } from "./components/SessionManager/SessionManager";
import { ClaimFormNav } from "./components/ClaimFormNav/ClaimFormNav";
import HomePage from "./pages/Home/Home";
import { SystemAdminMessage } from "./components/SystemAdminMessage/SystemAdminMessage";
import { useFeatureFlags } from "./pages/FlagsWrapper/FlagsWrapper";
import { Routes as ROUTES } from "./routes";
import { useGetCompletedClaim } from "./queries/claim";

const NotFound = () => {
  const { t } = useTranslation("common");
  return (
    <main id="main-content" role="main">
      <section className="grid-container usa-section">
        <div className="grid-row">
          <h1>{t("page_not_found")}</h1>
        </div>
      </section>
    </main>
  );
};

function App() {
  const ldFlags = useFeatureFlags();
  const { t } = useTranslation("common");
  const BYPASS_COMPLETED_CHECK =
    process.env.NODE_ENV === "development" &&
    process.env.REACT_APP_BYPASS_COMPLETED_CLAIM_CHECK === "true";
  const { status } = useGetCompletedClaim();
  const isSubmitted = !BYPASS_COMPLETED_CHECK && status === "success";
  const {
    HOME_PAGE,
    CLAIM_FORM_PAGE,
    CLAIM_FORM_PAGE_SEGMENT,
    WHOAMI_PAGE,
    CLAIMS_PAGE,
    CLAIM_FORM_HOME,
    SUCCESS_PAGE,
  } = ROUTES;
  return (
    <>
      <SessionManager />
      <Header basic>
        <a className="usa-skipnav" href="#main-content">
          {t("skip_to_main_content")}
        </a>
        <GovBanner />
        {ldFlags.systemAdminMessage && (
          <SystemAdminMessage variant={ldFlags.systemAdminMessageType}>
            {ldFlags.systemAdminMessage}
          </SystemAdminMessage>
        )}
        <ClaimFormNav isSubmitted={isSubmitted} />
      </Header>

      <section className="usa-section">
        <GridContainer>
          <AuthContainer>
            <Suspense
              fallback={
                <main id="main-content">
                  <PageLoader />
                </main>
              }
            >
              <Routes>
                {ldFlags.showClaimsDashboard && (
                  <Route path={CLAIMS_PAGE} element={<ClaimsDashboardPage />} />
                )}
                <Route path={SUCCESS_PAGE} element={<SuccessPage />} />
                {isSubmitted ? (
                  <Route
                    path="*"
                    element={<Navigate replace to={SUCCESS_PAGE} />}
                  />
                ) : (
                  <>
                    <Route path={WHOAMI_PAGE} element={<WhoAmIPage />} />
                    <Route
                      path={CLAIM_FORM_PAGE_SEGMENT}
                      element={<ClaimFormPage />}
                    />
                    <Route path={CLAIM_FORM_PAGE} element={<ClaimFormPage />} />
                    <Route path={HOME_PAGE} element={<HomePage />} />
                    <Route
                      path={CLAIM_FORM_HOME}
                      element={
                        <Navigate
                          replace
                          to={`${CLAIM_FORM_HOME}${pages[0].path}`}
                        />
                      }
                    />
                  </>
                )}
                {/* always last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthContainer>
        </GridContainer>
      </section>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
