import { useState } from "react";

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
import { QueryClient, QueryClientProvider } from "react-query";

import { Routes } from "./routes";
import WhoAmIPage from "./pages/whoami";
import HomePage from "./pages/home";

import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      suspense: true,
      retry: 0,
      // Cache queries up to five minutes by default
      cacheTime: 1000 * 5 * 60,
      // Queries are immediately stale. Can change on a per-query basis.
      staleTime: 0,
    },
  },
});

function App() {
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

  return (
    <QueryClientProvider client={queryClient}>
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
                <WhoAmIPage />
              </Route>
              <Route path={HOME_PAGE}>
                <HomePage />
              </Route>
            </Switch>
          </GridContainer>
        </section>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
