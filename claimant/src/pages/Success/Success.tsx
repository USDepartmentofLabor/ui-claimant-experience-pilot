import { Alert } from "@trussworks/react-uswds";
import { Trans, useTranslation } from "react-i18next";
import { useGetCompletedClaim } from "../../queries/claim";
import { formatDate } from "../../utils/format";

const Success = () => {
  const { t } = useTranslation("home");
  const {
    data: completedClaimResponse,
    isFetched: completedIsFetched,
    error,
  } = useGetCompletedClaim();

  if (!completedIsFetched || error) {
    return <></>;
  }

  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  const completedClaim: ClaimantClaim = completedClaimResponse!.data;
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  const completedDate = formatDate(completedClaim.completed_at!);
  const claimId = completedClaim.id;

  const AlertMessage = () => {
    return (
      <Trans
        t={t}
        i18nKey="success.message"
        values={{ claimId }}
        components={{ claimId: <span className="claim-id" />, completedDate }}
      />
    );
  };

  return (
    <div className="display-flex flex-column margin-top-5">
      <main className="tablet:width-mobile-lg margin-x-auto" id="main-content">
        <section className="completed-claim">
          <h1>{t("success.title")}</h1>
          <Alert type="success" heading={t("success.heading")}>
            <AlertMessage />
          </Alert>
        </section>
        <section>
          <h2>{t("success.next_steps")}</h2>
          <p>TODO</p>
        </section>
      </main>
    </div>
  );
};

export default Success;
