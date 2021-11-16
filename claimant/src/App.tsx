import { useState } from "react";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Link,
} from "react-router-dom";

import { ReactQueryDevtools } from "react-query/devtools";

import {
  GovBanner,
  Header,
  Title,
  NavMenuButton,
  PrimaryNav,
  GridContainer,
} from "@trussworks/react-uswds";
import { QueryClient, QueryClientProvider } from "react-query";

import { Routes as ROUTES } from "./routes";
import WhoAmIPage from "./pages/Whoami/Whoami";
import HomePage from "./pages/Home/Home";
import { AuthContainer } from "./common/AuthContainer";

// These classes are imported globally and can be used on every page
import "./styles.scss";
import "@trussworks/react-uswds/lib/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
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
  const { HOME_PAGE, WHOAMI_PAGE } = ROUTES;

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
    <QueryClientProvider client={queryClient}>
      <Router basename={ROUTES.BASE_ROUTE}>
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
              <Routes>
                <Route path={WHOAMI_PAGE} element={<WhoAmIPage />} />
                <Route path={HOME_PAGE} element={<HomePage />} />
              </Routes>
            </AuthContainer>
          </GridContainer>
        </section>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
