// import styles from "./ClaimFormHeading.module.scss";
import { useState } from "react";

import { NavLink, Link, useLocation } from "react-router-dom";

import {
  Title,
  NavMenuButton,
  NavDropDownButton,
  Menu,
  IconLaunch,
  PrimaryNav,
  Link as ExtLink,
} from "@trussworks/react-uswds";

import { Routes as ROUTES } from "../../routes";

import { useTranslation } from "react-i18next";

// These classes are imported globally and can be used on every page
import "@trussworks/react-uswds/lib/index.css";
import { pages } from "../../pages/PageDefinitions";
import { useFeatureFlags } from "../../pages/FlagsWrapper/FlagsWrapper";
import { useGetPartialClaim } from "../../queries/claim";
import { useClaimProgress } from "../../hooks/useClaimProgress";

type ClaimFormNavProps = {
  isSubmitted?: boolean;
};

export const ClaimFormNav = ({ isSubmitted }: ClaimFormNavProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const {
    BASE_ROUTE,
    HOME_PAGE,
    CLAIMS_PAGE,
    CLAIM_FORM_HOME,
    BASE_URL,
    LOGOUT_URL,
  } = ROUTES;
  const { t } = useTranslation("common");
  const ldFlags = useFeatureFlags();

  const toggleMobileNav = () => {
    setMobileNavOpen((prevOpen) => !prevOpen);
  };

  //page_headings
  const { data: partialClaimResponse } = useGetPartialClaim();
  const { continuePath } = useClaimProgress(partialClaimResponse);
  const location = useLocation();
  const continuePage = continuePath
    .replace(CLAIM_FORM_HOME, "")
    .replace("/", "");
  const currentPage = location.pathname.replace(CLAIM_FORM_HOME, "");
  let incomplete = false;
  const appMenuItems = pages.map((page) => {
    const heading = t(`page_headings.${page.heading}`);
    if (incomplete) {
      return (
        <>
          <span className="nav-future">{heading}</span>
          <span className="screen-reader-only">, not completed</span>
        </>
      );
    } else {
      const path = page.path;
      const isCurrentPage = path == currentPage;
      incomplete = continuePage === path;
      return (
        <a
          href={BASE_ROUTE + CLAIM_FORM_HOME + path}
          key={path}
          aria-current={isCurrentPage ? "step" : "false"}
        >
          {heading}
          {incomplete || (
            <span className="screen-reader-only">, completed</span>
          )}
        </a>
      );
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  const isCurrent = location.pathname
    .toLowerCase()
    .includes(CLAIM_FORM_HOME.toLowerCase());

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
          <NavDropDownButton
            menuId="appMenu"
            key="appMenu"
            onToggle={(): void => {
              setIsOpen(!isOpen);
            }}
            isOpen={isOpen}
            label="My application"
            isCurrent={isCurrent}
            aria-current={isCurrent ? "page" : "false"}
          />,
          <Menu
            key="appMenu"
            items={appMenuItems}
            isOpen={isOpen}
            id="appMenu"
          />,
          //TODO add 'contact us' page
        ]),
    <ExtLink
      key="logingovlink"
      variant="external"
      href={`${BASE_URL}/logindotgov/profile/`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${t("login_gov")} (opens in a new tab)`}
    >
      {t("login_gov")}
      <IconLaunch key="launch" aria-hidden="true" />
    </ExtLink>,
    <ExtLink key="logoutlink" href={LOGOUT_URL}>
      {t("logout")}
    </ExtLink>,
  ];

  if (ldFlags.testFlagClient) {
    navItems.push(
      <span className="display-none" aria-hidden="true">
        testFlagClient
      </span>
    );
    console.log({ ldFlags });
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
    <div className="usa-nav-container">
      <div className="usa-navbar">
        <Title>
          <Link to={HOME_PAGE}>Disaster Unemployment Assistance</Link>
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
  );
};
