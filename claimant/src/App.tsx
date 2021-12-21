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

import { AuthContainer } from "./common/AuthContainer";
import { useTranslation } from "react-i18next";

// These classes are imported globally and can be used on every page
import "./styles.scss";
import "@trussworks/react-uswds/lib/index.css";
import { pages } from "./pages/PageDefinition";
import PageLoader from "./common/PageLoader";

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { HOME_PAGE, CLAIM_FORM_PAGE, CLAIM_FORM_PAGE_SEGMENT, WHOAMI_PAGE } =
    ROUTES;
  const { t } = useTranslation("common");
  const baseUrl = process.env.REACT_APP_BASE_URL || "";
  const logoutUrl = `${baseUrl}/logout/`;

  const toggleMobileNav = () => {
    setMobileNavOpen((prevOpen) => !prevOpen);
  };

  const navItems = [
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
    <ExtLink key="logoutlink" href={logoutUrl}>
      {t("logout")}
    </ExtLink>,
  ];

  return (
    <>
      <Header basic>
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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path={WHOAMI_PAGE} element={<WhoAmIPage />} />
                <Route
                  path={CLAIM_FORM_PAGE_SEGMENT}
                  element={<ClaimFormPage />}
                />
                <Route path={CLAIM_FORM_PAGE} element={<ClaimFormPage />} />
                {/* TODO for now, redirect all to /claim/ -- future replace with HomePage once that has content */}
                <Route
                  path={`${HOME_PAGE}`}
                  element={<Navigate replace to={`/claim/${pages[0].path}`} />}
                />
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
