import { useEffect } from "react";
import { Alert, Link as ExtLink } from "@trussworks/react-uswds";
import { Trans, useTranslation } from "react-i18next";
import { useGetCompletedClaim } from "../../queries/claim";
import { formatDate } from "../../utils/format";

const Success = () => {
  const { t } = useTranslation("home");
  const { t: tCommon } = useTranslation("common");
  const {
    data: completedClaimResponse,
    isFetched: completedIsFetched,
    error,
  } = useGetCompletedClaim();

  useEffect(() => {
    document.title = `${t("success.title")} | ${tCommon("form_title")}`;
  }, []);

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
          <h2>{t("success.next_steps.heading")}</h2>
          <p>{t("success.next_steps.body_p1")}</p>
          <p>
            <Trans i18nKey="success.next_steps.body_p2">
              You will begin certifying for your benefits each week at
              <ExtLink
                href="/placeholder-website"
                target="_blank"
                rel="noreferrer"
              >
                XYZ website
              </ExtLink>
              . We will send you emails to remind you.
            </Trans>
          </p>
          <p>
            <Trans i18nKey="success.next_steps.body_p3">
              If you don&apos;t hear from us in [X] days, please
              <ExtLink
                href="/placeholder-contact-us"
                target="_blank"
                rel="noreferrer"
              >
                contact us
              </ExtLink>
              .
            </Trans>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Success;
