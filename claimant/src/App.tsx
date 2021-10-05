import React, { useState } from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink,
  Link,
} from "react-router-dom";

import "@trussworks/react-uswds/lib/uswds.css";
import "@trussworks/react-uswds/lib/index.css";
import {
  GovBanner,
  Header,
  Title,
  NavMenuButton,
  PrimaryNav,
  GridContainer,
} from "@trussworks/react-uswds";

import { Routes } from "./routes";
import WhoAmIPage from "./pages/whoami";
import HomePage from "./pages/home";
import withClaimant, { WithClaimantProps } from "./hoc/with-claimant";

import "./App.css";

type Props = WithClaimantProps;

function App(props: Props) {
  const { currentClaimant } = props;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { HOME_PAGE, WHOAMI_PAGE } = Routes;

  const toggleMobileNav = () => {
    setMobileNavOpen((prevOpen) => !prevOpen);
  };

  const navItems = [
    <NavLink to={HOME_PAGE} key={HOME_PAGE} activeClassName="usa-current" exact>
      Home
    </NavLink>,
    <NavLink to={WHOAMI_PAGE} key={WHOAMI_PAGE} activeClassName="usa-current">
      Who am I
    </NavLink>,
  ];

  if (!currentClaimant) {
    return (
      <Router basename="/claimant">
        <GovBanner />
        <Header basic>
          <div className="usa-nav-container">
            <div className="usa-navbar">
              <Title>
                <Link to={HOME_PAGE}>Unemployment Insurance</Link>
              </Title>
            </div>
          </div>
        </Header>
        <section className="usa-section">
          <GridContainer>
            <img
              src="https://www.dol.gov/themes/opa_theme/img/logo-primary.svg"
              alt="logo"
              height="200"
            />
            <h2>Checking authorization...</h2>
          </GridContainer>
        </section>
      </Router>
    );
  }

  return (
    <Router basename="/claimant">
      <GovBanner />
      <Header basic>
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
          <Switch>
            <Route path={WHOAMI_PAGE}>
              {currentClaimant && <WhoAmIPage whoami={currentClaimant} />}
            </Route>
            <Route path={HOME_PAGE}>
              {currentClaimant && <HomePage whoami={currentClaimant} />}
            </Route>
          </Switch>
        </GridContainer>
      </section>
    </Router>
  );
}

export default withClaimant(App);
