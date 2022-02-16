import { useState, lazy, Suspense } from "react";

import { Routes, Route, NavLink, Link, Navigate } from "react-router-dom";

import { ReactQueryDevtools } from "react-query/devtools";

import {
  GovBanner,
  Header,
  Title,
  NavMenuButton,
  PrimaryNav,
  GridContainer,
  Link as ExtLink,
} from "@trussworks/react-uswds";

import { Routes as ROUTES } from "./routes";

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
import { useFeatureFlags } from "./pages/FlagsWrapper/FlagsWrapper";
import HomePage from "./pages/Home/Home";
import { useGetCompletedClaim } from "./queries/claim";

const BYPASS_COMPLETED_CHECK =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_COMPLETED_CLAIM_CHECK === "true";

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    HOME_PAGE,
    CLAIM_FORM_PAGE,
    CLAIM_FORM_PAGE_SEGMENT,
    WHOAMI_PAGE,
    CLAIMS_PAGE,
    CLAIM_FORM_HOME,
    SUCCESS_PAGE,
    SUCCESS_PAGE_JUST_FINISHED,
  } = ROUTES;
  const { t } = useTranslation("common");
  const baseUrl = process.env.REACT_APP_BASE_URL || "";
  const logoutUrl = `${baseUrl}/logout/`;
  const ldFlags = useFeatureFlags();
  const { status } = useGetCompletedClaim();

  // Determine if we should go to the success page
  const isSubmitted = !BYPASS_COMPLETED_CHECK && status === "success";

  const toggleMobileNav = () => {
    setMobileNavOpen((prevOpen) => !prevOpen);
  };

  const navItems = [
    ...(isSubmitted
      ? []
      : [
          <NavLink
            end
            to={HOME_PAGE}
            key={HOME_PAGE}
            className={({ isActive }) => (isActive ? "usa-current" : "")}
          >
            Home
          </NavLink>,
          <NavLink
            end
            to={WHOAMI_PAGE}
            key={WHOAMI_PAGE}
            className={({ isActive }) => (isActive ? "usa-current" : "")}
          >
            Who am I
          </NavLink>,
        ]),
    <ExtLink key="logoutlink" href={logoutUrl}>
      {t("logout")}
    </ExtLink>,
  ];

  // TODO perhaps a page specifically to display LD flags?
  if (ldFlags.testFlagClient) {
    navItems.push(<span>testFlagClient</span>);
  }

  if (ldFlags.showClaimsDashboard) {
    const dashboardLink = (
      <NavLink
        end
        to={CLAIMS_PAGE}
        key={CLAIMS_PAGE}
        className={({ isActive }) => (isActive ? "usa-current" : "")}
      >
        Claims
      </NavLink>
    );
    navItems.splice(1, 0, dashboardLink);
  }

  return (
    <>
      <Header basic>
        <a className="usa-skipnav" href="#main-content">
          {t("skip_to_main_content")}
        </a>
        <GovBanner />
        <div className="usa-nav-container">
          <div className="usa-navbar">
            <Title>
              <Link to={HOME_PAGE}>Unemployment Insurance</Link>
            </Title>
            <NavMenuButton
              label="Menu"
              onClick={toggleMobileNav}
              className="usa-menu-btn"
            />
          </div>

          <PrimaryNav
            aria-label="Primary navigation"
            items={navItems}
            onToggleMobileNav={toggleMobileNav}
            mobileExpanded={mobileNavOpen}
          />
        </div>
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
                <Route
                  path={SUCCESS_PAGE_JUST_FINISHED}
                  element={<SuccessPage justFinished />}
                />
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
