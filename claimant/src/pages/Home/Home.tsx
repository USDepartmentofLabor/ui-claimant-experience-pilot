import React, { PropsWithChildren } from "react";
import { useQueryClient } from "react-query";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Alert } from "@trussworks/react-uswds";
import classnames from "classnames";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useWhoAmI } from "../../queries/whoami";
import { Routes } from "../../routes";
import { formatExpiresAtDate } from "../../utils/format";
import { useGetPartialClaim, useSubmitClaim } from "../../queries/claim";
import { useClaims } from "../../queries/claims";
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

type Status = "not_started" | "in_progress" | "complete";

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
  const { data: partialClaimResponse, isFetched: partialIsFetched } =
    useGetPartialClaim();
  const { data: claimsResponse, isFetched: claimsIsFetched } = useClaims();
  const claimDeleted =
    claimsResponse?.claims.length &&
    claimsResponse.claims[0].status === "deleted";
  const resetDate = claimDeleted
    ? claimsResponse?.claims[0].updated_at
    : undefined;
  const { continuePath } = useClaimProgress(partialClaimResponse);

  if (error) {
    throw error;
  }

  const pageReady = () =>
    whoami &&
    partialClaimResponse?.claim &&
    whoamiIsFetched &&
    partialIsFetched &&
    claimsIsFetched;

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
  const claimHasErrors = partialClaimResponse?.validation_errors;

  const determineClaimStatus = () => {
    if (!claimStarted || claimDeleted) {
      return "not_started";
    }
    if (claimHasErrors) {
      return "in_progress";
    }
    return "complete";
  };

  const identityStatus: Status =
    whoami?.IAL === "2" ? "complete" : "not_started";
  const claimStatus: Status = determineClaimStatus();

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
        claimStatus === "complete"
          ? t("application.ready_to_submit.title")
          : t("application.not_ready_to_submit.title"),
      status: claimStatus,
      Content: () => (
        <ApplicationContent
          remainingTime={remainingTime}
          expiresAt={expiresAt}
          claimStatus={claimStatus}
          continuePath={continuePath}
        >
          {claimStatus === "complete" && (
            <Link className="usa-button usa-button--outline" to={continuePath}>
              {t("application.edit")}
            </Link>
          )}
        </ApplicationContent>
      ),
      MoreInfo: () => <Accordion {...applicationMoreInfoProps} />,
    });
  }

  if (identityStatus === "complete" && claimStatus === "complete") {
    tasks.reverse();
  }

  const remainingTasks = tasks.filter(({ status }) => status !== "complete");

  const greetingName =
    partialClaim?.claimant_name?.first_name || whoami?.first_name;

  const okToSubmitClaimApp = () => {
    return remainingTasks.length === 0 || claimStatus === "complete";
  };

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
        <div>
          {remainingTasks.length === 1 && <p>{t("remaining_tasks.one")}</p>}
          {remainingTasks.length === 2 && <p>{t("remaining_tasks.two")}</p>}
          {remainingTasks.length > 1 && <p>{t("remaining_tasks.listTitle")}</p>}
          {remainingTasks.length > 0 && (
            <ul>
              {remainingTasks.map(({ listText }) => (
                <li key={listText}>{listText}</li>
              ))}
            </ul>
          )}
          {claimDeleted && (
            <p className="margin-top-4">
              {t("remaining_tasks.resetMessage", {
                resetDate: resetDate && formatExpiresAtDate(resetDate),
              })}
            </p>
          )}
        </div>
        {okToSubmitClaimApp() && <SubmitClaimCard />}
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
  claimStatus: keyof Record<Status, string>;
  continuePath: string;
}

const ApplicationContent = ({
  claimStatus,
  expiresAt,
  remainingTime,
  continuePath,
  children,
}: PropsWithChildren<IApplicationContent>) => {
  const { t } = useTranslation("home");
  const hoursRemaining = parseInt(remainingTime[0]);
  const showWarning =
    claimStatus === "in_progress" &&
    hoursRemaining < SHOW_EXPIRATION_WARNING_WITH_HOURS_REMAINING;

  if (claimStatus !== "complete") {
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
        {children}
      </>
    );
  }

  return <>{children}</>;
};

const SubmitClaimCard = () => {
  const { t } = useTranslation("home");
  const submitClaim = useSubmitClaim();
  const { data: partialClaimResponse, isFetched: partialIsFetched } =
    useGetPartialClaim();
  const { data: whoami, isFetched: whoamiIsFetched, error } = useWhoAmI();
  const queryClient = useQueryClient();

  if (error) {
    throw error;
  }
  if (!whoamiIsFetched || !partialIsFetched) {
    return <></>;
  }

  const claimSubmissionCompleted = () => {
    return submitClaim.isSuccess && submitClaim.data.status === 201;
  };

  const claimSubmissionError = () => {
    return submitClaim.isError;
  };

  const submitCompletedClaim = async () => {
    const claim: Claim = {
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      ...(partialClaimResponse!.claim as Claim),
      is_complete: true,
    };
    const r = await submitClaim.mutateAsync(claim);
    // invalidate cache on success so we refetch everywhere
    // this will effectively re-render the whole page and navigate us
    // to the success page
    if (r.data.status === "accepted") {
      queryClient.invalidateQueries("getCompletedClaim");
    }
  };

  const classes = classnames(
    "border-2px border-base-lightest padding-2 margin-y-3 bg-gray-5"
  );

  return (
    <>
      <div className={classes}>
        <h2 className="margin-0">
          {t("submit_claim_card.title", { stateName: whoami?.swa.name })}
        </h2>
        <p className="display-flex flex-align-center">
          <Button
            data-testid="submit-claim-button"
            onClick={submitCompletedClaim}
            disabled={claimSubmissionCompleted()}
            type="submit"
          >
            {t("submit_claim_card.submit_application_button")}
          </Button>
        </p>
      </div>
      {claimSubmissionError() && (
        <Alert type="error" heading={t("submit_claim_card.error.heading")}>
          {t("submit_claim_card.error.body")}
        </Alert>
      )}
    </>
  );
};
