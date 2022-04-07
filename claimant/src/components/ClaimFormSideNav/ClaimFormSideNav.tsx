import React from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { SideNav } from "@trussworks/react-uswds";
import { useClaimProgress } from "../../hooks/useClaimProgress";
import { useGetPartialClaim } from "../../queries/claim";
import { pages } from "../../pages/PageDefinitions";
import { Routes } from "../../routes";

type ClaimFormSideNavProps = {
  className?: string;
};

export const ClaimFormSideNav = ({ className }: ClaimFormSideNavProps) => {
  const { data: partialClaimResponse } = useGetPartialClaim();
  const { t } = useTranslation("common", { keyPrefix: "page_headings" });
  const { page } = useParams();
  const currentPageIndex = pages.findIndex((p) => p.path === page);
  if (currentPageIndex === -1) {
    throw new Error("Page not found");
  }
  const { continuePath } = useClaimProgress(partialClaimResponse);
  const continuePage = continuePath
    .replace(Routes.CLAIM_FORM_HOME, "")
    .replace("/", "");
  const continuePageIndex = pages.findIndex((p) => p.path === continuePage);
  const getCompletionStatus = (index: number) => {
    if (index === continuePageIndex) return "current";
    if (index < continuePageIndex) return "complete";
    return undefined;
  };
  const getStatus = (index: number) => {
    if (index === currentPageIndex) return "current";
    if (index < currentPageIndex) return "complete";
    return undefined;
  };
  const appItems = pages.map((page, i) => {
    const heading = t(page.heading);
    const path = page.path;
    const status = getStatus(i);
    const completionStatus = getCompletionStatus(i);
    return completionStatus === undefined ? (
      <>
        <span className="nav-future">{heading}</span>
        <span className="screen-reader-only">, not completed</span>
      </>
    ) : (
      <a
        href={path}
        key={path}
        aria-current={status === "current" ? "step" : "false"}
        className={status === "current" ? "usa-current" : ""}
      >
        {heading}
        {completionStatus !== "complete" || (
          <span className="screen-reader-only">, completed</span>
        )}
      </a>
    );
  });

  return (
    <div className={className}>
      <SideNav items={appItems} />
    </div>
  );
};
