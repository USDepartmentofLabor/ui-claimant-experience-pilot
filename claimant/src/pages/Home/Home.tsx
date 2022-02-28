import React, { PropsWithChildren } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "@trussworks/react-uswds";
import classnames from "classnames";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useWhoAmI } from "../../queries/whoami";
import { Routes } from "../../routes";
import { formatExpiresAtDate } from "../../utils/format";
import { useGetCompletedClaim, useGetPartialClaim } from "../../queries/claim";
import {
  Accordion,
  Button,
  IconCheck,
  IconLaunch,
  Link as ExtLink,
} from "@trussworks/react-uswds";
import { useClaimProgress } from "../../hooks/useClaimProgress";
import PageLoader from "../../common/PageLoader";

import styles from "./Home.module.scss";

type Status = "not_started" | "in_progress" | "ready_to_submit" | "complete";

const baseUrl = process.env.REACT_APP_BASE_URL || "";

const SHOW_EXPIRATION_WARNING_WITH_HOURS_REMAINING = 48;
const FEATURE_SET_CLAIM_AND_IDENTITY = "Claim And Identity";
const FEATURE_SET_IDENTITY_ONLY = "Identity Only";
const FEATURE_SET_CLAIM_ONLY = "Claim Only";
const CLAIM_SKELETON_SIZE = 4; // a bootstrapped claim has this many keys before any submission

type AccordionProps = React.ComponentProps<typeof Accordion>;

const HomePage = () => {
  const { t } = useTranslation("home");
  const { data: whoami, isFetched: whoamiIsFetched, error } = useWhoAmI();
  const { status: completedFetchStatus, isFetched: completedIsFetched } =
    useGetCompletedClaim();
  const { data: partialClaimResponse, isFetched: partialIsFetched } =
    useGetPartialClaim();
  const { continuePath } = useClaimProgress(partialClaimResponse);

  if (error) {
    throw error;
  }

  const pageReady = () =>
    whoami &&
    partialClaimResponse?.claim &&
    whoamiIsFetched &&
    completedIsFetched &&
    partialIsFetched;

  if (!pageReady()) {
    return <PageLoader />;
  }

  const partialClaim = partialClaimResponse?.claim;
  const expiresAt = `${
    partialClaimResponse?.expires
      ? formatExpiresAtDate(partialClaimResponse?.expires)
      : t("today")
  } ${t("expires_at_time")}`;
  const remainingTime = (
    partialClaimResponse?.remaining_time || "00:00:00"
  ).split(/:/);
  const claimStarted =
    partialClaim && Object.keys(partialClaim).length > CLAIM_SKELETON_SIZE;

  const identityStatus: Status =
    whoami?.IAL === "2" ? "complete" : "not_started";
  const claimStatus: Status =
    completedFetchStatus === "success"
      ? "ready_to_submit"
      : claimStarted
      ? "in_progress"
      : "not_started";

  const claimProgressDeterminationIncomplete = () =>
    claimStatus === "in_progress" && continuePath === Routes.CLAIM_FORM_HOME;

  if (claimProgressDeterminationIncomplete()) {
    return <PageLoader />;
  }

  const identityMoreInfoProps: AccordionProps = {
    items: [
      {
        title: t("identity.moreInfo.title"),
        content: (
          <ul>
            {t("identity.moreInfo.content", { returnObjects: true }).map(
              (bullet, i) => (
                <li key={i}>{bullet}</li>
              )
            )}
          </ul>
        ),
        expanded: false,
        headingLevel: "h2",
        id: "identityVerificationMoreInfo",
        className: styles.moreInfoAccordion,
      },
    ],
    bordered: true,
  };

  const applicationMoreInfoProps: AccordionProps = {
    items: [
      {
        title: t("application.moreInfo.title"),
        content: (
          <ul>
            {t("application.moreInfo.content", { returnObjects: true }).map(
              (bullet, i) => (
                <li key={`moreInfo-${i}`}>
                  {bullet}
                  {i === 2 && (
                    <ul>
                      {t("application.moreInfo.workHistoryContent", {
                        returnObjects: true,
                      }).map((item, i) => (
                        <li key={`workHistory-${i}`}>{item}</li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            )}
          </ul>
        ),
        expanded: false,
        headingLevel: "h2",
        id: "applicationMoreInfo",
        className: styles.moreInfoAccordion,
      },
    ],
    bordered: true,
  };

  const identityTaskRequired = () =>
    whoami?.swa.featureset === FEATURE_SET_CLAIM_AND_IDENTITY ||
    whoami?.swa.featureset === FEATURE_SET_IDENTITY_ONLY;
  const claimAppTaskRequired = () =>
    whoami?.swa.featureset === FEATURE_SET_CLAIM_AND_IDENTITY ||
    whoami?.swa.featureset === FEATURE_SET_CLAIM_ONLY;
  const identityProvider = whoami?.identity_provider || "login.gov";

  const tasks = [];
  if (identityTaskRequired()) {
    tasks.push({
      listText: t("identity.list"),
      status: identityStatus,
      title: t(`identity.${identityStatus}.title`),
      Content: () => (
        <IdentityContent
          identityStatus={identityStatus}
          identityProvider={identityProvider}
        />
      ),
      MoreInfo: () => <Accordion {...identityMoreInfoProps} />,
    });
  }
  if (claimAppTaskRequired()) {
    tasks.push({
      listText: t("application.list"),
      title:
        claimStatus === "ready_to_submit"
          ? t("application.ready_to_submit.title")
          : t("application.not_ready_to_submit.title"),
      status: claimStatus,
      Content: () => (
        <ApplicationContent
          remainingTime={remainingTime}
          expiresAt={expiresAt}
          claimStatus={claimStatus}
          continuePath={continuePath}
        />
      ),
      MoreInfo: () => <Accordion {...applicationMoreInfoProps} />,
    });
  }

  if (identityStatus === "complete" && claimStatus !== "ready_to_submit") {
    tasks.reverse();
  }

  const remainingTasks = tasks.filter(({ status }) => status !== "complete");

  const greetingName =
    partialClaim?.claimant_name?.first_name || whoami?.first_name;

  return (
    <main className="tablet:width-mobile-lg margin-x-auto">
      <RequestErrorBoundary>
        {greetingName ? (
          <h1>
            {t("welcome")}
            {greetingName && <>, {greetingName}</>}
          </h1>
        ) : (
          <h1>{t("namelessWelcome")}</h1>
        )}
        <div className="padding-bottom-4">
          {remainingTasks.length === 1 && <p>{t("remaining_tasks.one")}</p>}
          {remainingTasks.length === 2 && <p>{t("remaining_tasks.two")}</p>}
          {remainingTasks.length > 0 && (
            <>
              <p>{t("remaining_tasks.listTitle")}</p>
              <ul>
                {remainingTasks.map(({ listText }) => (
                  <li key={listText}>{listText}</li>
                ))}
              </ul>
            </>
          )}
        </div>
        {tasks.map(({ title, status, Content, MoreInfo }) => (
          <div key={title} className="margin-top-8">
            {status !== "complete" && <MoreInfo />}
            <ProgressCard key={title} title={title} status={status}>
              <Content />
            </ProgressCard>
          </div>
        ))}
        <div className="margin-top-15 padding-y-5 border-top-2px border-bottom-2px border-base-lighter">
          <h2>{t("afterApply.title")}</h2>
          <p>{t("afterApply.content")}</p>
          <h2>{t("moreInformation.title")}</h2>
          <ul>
            <li>{t("moreInformation.contactUs")}</li>
            <li>{t("moreInformation.about")}</li>
          </ul>
        </div>
        <p>{t("disclaimer")}</p>
      </RequestErrorBoundary>
    </main>
  );
};

export default HomePage;

interface IProgressCardProps {
  title: string;
  status: Status;
}

const ProgressCard = ({
  title,
  status,
  children,
}: PropsWithChildren<IProgressCardProps>) => {
  const { t } = useTranslation("home");

  const classes = classnames(
    "border-2px border-base-lightest padding-2 margin-y-3",
    status !== "complete" && "bg-gray-5"
  );

  return (
    <div className={classes}>
      <h2 className="margin-0">{title}</h2>
      <p className="display-flex flex-align-center">
        {status === "complete" && (
          <IconCheck
            size={3}
            aria-hidden="true"
            className="margin-right-05 text-cyan"
          />
        )}
        <span>
          <span className="text-bold">{t("status.label")}:</span>{" "}
          {t(`status.${status}`)}
        </span>
      </p>
      {children}
    </div>
  );
};

interface IIdentityContent {
  identityProvider: "login.gov" | "Local";
  identityStatus: keyof Pick<
    Record<Status, string>,
    "not_started" | "complete"
  >;
}

const IdentityContent = ({
  identityProvider,
  identityStatus,
}: IIdentityContent) => {
  const { t } = useTranslation("home");
  const { data: whoami } = useWhoAmI();

  if (identityStatus === "complete") {
    return (
      <p>
        <Trans
          t={t}
          i18nKey="identity.complete.description"
          components={{
            extLink: (
              <ExtLink
                variant="external"
                href={`${baseUrl}/logindotgov/profile/`}
                target="_blank"
                rel="noreferrer"
              >
                Login.gov
              </ExtLink>
            ),
            span: <span key="new-tab" className="screen-reader-only" />,
            icon: <IconLaunch key="launch" size={3} aria-hidden="true" />,
          }}
        />
        .
      </p>
    );
  }

  const verifyIdentityUrl = () => {
    if (identityProvider === "login.gov") {
      return `${baseUrl}/logindotgov/?ial=2&swa_code=${whoami?.swa.code}`;
    } else if (identityProvider === "Local") {
      return `${baseUrl}/login/?ial=2&swa_code=${whoami?.swa.code}`;
    }
  };

  return (
    <>
      <p>{t("identity.not_started.description")}</p>
      <div className="text-center">
        <a className="usa-button margin-x-auto" href={verifyIdentityUrl()}>
          {t("identity.not_started.start")} &#8594;
        </a>
      </div>
    </>
  );
};

interface IApplicationContent {
  expiresAt: string;
  remainingTime: string[];
  claimStatus: keyof Omit<Record<Status, string>, "complete">;
  continuePath: string;
}

const ApplicationContent = ({
  claimStatus,
  expiresAt,
  remainingTime,
  continuePath,
}: IApplicationContent) => {
  const { t } = useTranslation("home");
  const hoursRemaining = parseInt(remainingTime[0]);
  const showWarning =
    claimStatus === "in_progress" &&
    hoursRemaining < SHOW_EXPIRATION_WARNING_WITH_HOURS_REMAINING;

  if (claimStatus !== "ready_to_submit") {
    return (
      <>
        {showWarning && (
          <Alert type="error">
            <Trans
              t={t}
              i18nKey="application.expiration_warning"
              components={{ when: expiresAt }}
            />
          </Alert>
        )}
        <p>{t("application.not_ready_to_submit.description")}</p>
        <div className="display-flex flex-justify-center">
          <Link
            className="usa-button"
            to={
              claimStatus === "not_started"
                ? Routes.CLAIM_FORM_HOME
                : continuePath
            }
          >
            {claimStatus === "not_started"
              ? t("application.not_ready_to_submit.start_application")
              : t("application.not_ready_to_submit.continue")}
          </Link>
          {/* TODO: Enable claim deletion */}
          {claimStatus === "in_progress" && (
            <Button outline type="button">
              {t("application.not_ready_to_submit.delete_application")}
            </Button>
          )}
        </div>
      </>
    );
  }

  return null;
};
