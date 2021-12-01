import { useState } from "react";

import { Routes, Route, NavLink, Link } from "react-router-dom";

import { ReactQueryDevtools } from "react-query/devtools";

import {
  GovBanner,
  Header,
  Title,
  NavMenuButton,
  PrimaryNav,
  GridContainer,
} from "@trussworks/react-uswds";

import { Routes as ROUTES } from "./routes";
import WhoAmIPage from "./pages/Whoami/Whoami";
import HomePage from "./pages/Home/Home";
import { AuthContainer } from "./common/AuthContainer";
import { useTranslation } from "react-i18next";

import { useLogout } from "./queries/logout";
// These classes are imported globally and can be used on every page
import "./styles.scss";
import "@trussworks/react-uswds/lib/index.css";

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { HOME_PAGE, WHOAMI_PAGE } = ROUTES;
  const { t } = useTranslation("common");
  const logout = useLogout();
  const handleLogout = () => {
    logout.mutate();
  };

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
        <button className="usa-button--inverse" onClick={handleLogout}>
          {t("logout")}
        </button>
      </Header>

      <section className="usa-section">
        <GridContainer>
          <AuthContainer>
            <Routes>
              <Route path={WHOAMI_PAGE} element={<WhoAmIPage />} />
              <Route path={HOME_PAGE} element={<HomePage />} />
            </Routes>
          </AuthContainer>
        </GridContainer>
      </section>
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

export default App;
