import { useState } from "react";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useClaims, useCancelClaim } from "../../queries/claims";
import { useQueryClient } from "react-query";
import { useTranslation } from "react-i18next";
import common from "../../i18n/en/common";
import { formatISODateTimeString } from "../../utils/format";
import { Button, Link } from "@trussworks/react-uswds";
import { useFeatureFlags } from "../FlagsWrapper/FlagsWrapper";
import { useWhoAmI } from "../../queries/whoami";
import PageLoader from "../../common/PageLoader";

interface IClaimSummary {
  claim: ClaimantClaim;
  whoami: WhoAmI;
}

type StatusLabel = keyof typeof common.claims_dashboard.status_labels;

export const ClaimSummary = ({ claim }: IClaimSummary) => {
  const { t } = useTranslation("common", { keyPrefix: "claims_dashboard" });
  const ldFlags = useFeatureFlags();
  const cancelClaim = useCancelClaim();
  const setStatusChanged = useState(false)[1];
  const queryClient = useQueryClient();

  const getLastUpdated = () => {
    if (claim.status === "in_process") {
      return formatISODateTimeString(claim.updated_at);
    }
    if (claim.status === "cancelled") {
      return formatISODateTimeString(claim.deleted_at as string);
    }
    if (claim.status === "deleted") {
      return formatISODateTimeString(claim.deleted_at as string);
    }
    if (claim.status === "processing") {
      return formatISODateTimeString(claim.completed_at as string);
    }
    if (claim.status === "active") {
      return formatISODateTimeString(claim.fetched_at as string);
    }
    if (claim.status === "resolved") {
      return formatISODateTimeString(claim.resolved_at as string);
    }
    return formatISODateTimeString(claim.updated_at);
  };

  const getStatusLabel = () => {
    const label = claim.status as StatusLabel;
    return t(`status_labels.${label}`);
  };

  const handleCancelClaim = async () => {
    const r = await cancelClaim.mutateAsync(claim.id);
    if (r.status === "ok") {
      await queryClient.invalidateQueries("claims", { refetchInactive: true });
      setStatusChanged(true);
    }
  };

  const getActions = () => {
    const actions = [];
    if (claim.status === "in_process") {
      actions.push(
        <Link
          key={`${claim.id}-edit`}
          href="/claimant/claim/personal/"
          className="usa-button"
        >
          {t("button_actions.edit")}
        </Link>
      );
    }
    if (claim.status === "processing") {
      // TODO should this go to /contact/{claim.swa.code}/ or to the claimant_url ?
      actions.push(
        <Link
          key={`${claim.id}-contact`}
          href={claim.swa.claimant_url}
          variant="external"
        >
          {t("button_actions.contact")} {claim.swa.name}
        </Link>
      );
      ldFlags.allowClaimResolution &&
        actions.push(
          <Button
            key={`${claim.id}-cancel`}
            type="submit"
            secondary
            disabled={cancelClaim.isLoading || cancelClaim.isSuccess}
            onClick={handleCancelClaim}
            data-testid={`${claim.id}-cancel`}
          >
            {t("button_actions.cancel")}
          </Button>
        );
    }
    return actions;
  };

  return (
    <tr>
      <th data-label={t("id")} scope="row" className="text-pre">
        {claim.id}
      </th>
      <td data-label={t("status")}>{getStatusLabel()}</td>
      <td data-label={t("last_updated")}>{getLastUpdated()}</td>
      <td data-label={t("actions")}>
        <div className="dol-claims-actions">{getActions()}</div>
      </td>
    </tr>
  );
};

export const ClaimsDashboard = () => {
  const { data, isLoading, error } = useClaims();
  const { t } = useTranslation("common", { keyPrefix: "claims_dashboard" });
  const {
    data: whoami,
    isFetched: isFetchedWhoAmI,
    error: errorWhoAmI,
  } = useWhoAmI();

  if (!isFetchedWhoAmI || isLoading) {
    return <PageLoader />;
  }

  if (errorWhoAmI || !whoami) {
    throw errorWhoAmI;
  }

  if (error || !data) {
    throw error;
  }

  return (
    <>
      <h1>{t("heading")}</h1>
      <div className="width-mobile">
        <table className="usa-table usa-table--borderless usa-table--stacked-header">
          <thead>
            <tr>
              <th scope="col">{t("id")}</th>
              <th scope="col">{t("status")}</th>
              <th scope="col">{t("last_updated")}</th>
              <th scope="col">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {data.claims.map((claim, idx) => (
              <ClaimSummary claim={claim} whoami={whoami} key={idx} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const ClaimsDashboardPage = () => {
  return (
    <main id="main-content" data-testid="claims-dashboard">
      <RequestErrorBoundary>
        <ClaimsDashboard />
      </RequestErrorBoundary>
    </main>
  );
};

export default ClaimsDashboardPage;
