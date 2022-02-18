import { PropsWithChildren } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import classnames from "classnames";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useWhoAmI } from "../../queries/whoami";
import { Routes } from "../../routes";
import { useGetCompletedClaim, useGetPartialClaim } from "../../queries/claim";
import {
  Button,
  IconCheck,
  IconLaunch,
  Link as ExtLink,
} from "@trussworks/react-uswds";
import { useClaimProgress } from "../../hooks/useClaimProgress";
import PageLoader from "../../common/PageLoader";

type Status = "not_started" | "in_progress" | "ready_to_submit" | "complete";

const baseUrl = process.env.REACT_APP_BASE_URL || "";

const HomePage = () => {
  const { t } = useTranslation("home");
  const { data: whoami, error } = useWhoAmI();
  const { status: completedFetchStatus } = useGetCompletedClaim();
  const { data: partialClaim } = useGetPartialClaim();
  const { continuePath } = useClaimProgress(partialClaim);

  if (error) {
    throw error;
  }

  if (!partialClaim || !whoami) {
    return <PageLoader />;
  }

  const claimStarted = partialClaim && Object.keys(partialClaim).length > 0;

  const identityStatus: Status =
    whoami.IAL === "2" ? "complete" : "not_started";
  const claimStatus: Status =
    completedFetchStatus === "success"
      ? "ready_to_submit"
      : claimStarted
      ? "in_progress"
      : "not_started";

  const tasks = [
    {
      listText: t("identity.list"),
      status: identityStatus,
      title: t(`identity.${identityStatus}.title`),
      Content: () => <IdentityContent identityStatus={identityStatus} />,
    },
    {
      listText: t("application.list"),
      title:
        claimStatus === "ready_to_submit"
          ? t("application.ready_to_submit.title")
          : t("application.not_ready_to_submit.title"),
      status: claimStatus,
      Content: () => (
        <ApplicationContent
          claimStatus={claimStatus}
          continuePath={continuePath}
        />
      ),
    },
  ];

  if (identityStatus === "complete" && claimStatus !== "ready_to_submit") {
    tasks.reverse();
  }

  const remainingTasks = tasks.filter(({ status }) => status !== "complete");

  const greetingName =
    whoami.first_name || partialClaim?.claimant_name?.first_name;

  return (
    <main>
      <RequestErrorBoundary>
        <h1>
          {t("welcome")}
          {greetingName && <>, {greetingName}</>}
        </h1>
        {remainingTasks.length === 1 && <p>{t("remaining_tasks.one")}</p>}
        {remainingTasks.length === 2 && <p>{t("remaining_tasks.two")}</p>}
        <ul>
          {remainingTasks.map(({ listText }) => (
            <li key={listText}>{listText}</li>
          ))}
        </ul>
        {tasks.map(({ title, status, Content }) => (
          <ProgressCard key={title} title={title} status={status}>
            <Content />
          </ProgressCard>
        ))}
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
  identityStatus: keyof Pick<
    Record<Status, string>,
    "not_started" | "complete"
  >;
}

const IdentityContent = ({ identityStatus }: IIdentityContent) => {
  const { t } = useTranslation("home");

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
                href="https://login.gov"
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

  return (
    <>
      <p>{t("identity.not_started.description")}</p>
      <div className="text-center">
        <a
          className="usa-button margin-x-auto"
          href={`${baseUrl}/logindotgov/?ial=2`}
        >
          {t("identity.not_started.start")} &#8594;
        </a>
      </div>
    </>
  );
};

interface IApplicationContent {
  claimStatus: keyof Omit<Record<Status, string>, "complete">;
  continuePath: string;
}

const ApplicationContent = ({
  claimStatus,
  continuePath,
}: IApplicationContent) => {
  const { t } = useTranslation("home");

  if (claimStatus !== "ready_to_submit") {
    return (
      <>
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
