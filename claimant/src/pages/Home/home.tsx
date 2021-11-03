import { useQueryClient } from "react-query";
import { Formik } from "formik";
import { Button, Form } from "@trussworks/react-uswds";
import HomeStyles from "./Home.module.scss";
import { useWhoAmI } from "../../queries/whoami";
import { useSubmitClaim } from "../../queries/claim";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";

import PageLoader from "../../common/PageLoader";

const HomePage = () => {
  const { t } = useTranslation("home");

  return (
    <main>
      <h1>{t("welcome")}</h1>
      <p className="usa-intro">{t("intro")}</p>
      <section className="usa-section">
        <p className={HomeStyles.hello}>{t("sampleStyle")}</p>
      </section>
      <RequestErrorBoundary>
        <ClaimForm />
      </RequestErrorBoundary>
    </main>
  );
};

export default HomePage;

const ClaimForm = () => {
  const { data: whoami, error, isLoading } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home");

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || submitClaim.error || !whoami) {
    throw error || submitClaim.error;
  }

  return (
    <div>
      {submitClaim.isSuccess ? (
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Success status</h4>
            <p className="usa-alert__text">
              {t("sampleForm.claimSuccess")} <code>{whoami.claim_id}</code>
            </p>
          </div>
        </div>
      ) : (
        ""
      )}
      <Formik
        initialValues={{}}
        onSubmit={async () => {
          const claim: Claim = {
            swa_code: whoami.swa_code,
            claimant_id: whoami.claimant_id,
          };
          if (whoami.claim_id) {
            claim.id = whoami.claim_id;
          }
          const r = await submitClaim.mutateAsync(claim);
          if (!whoami.claim_id) {
            queryClient.setQueryData("whoami", {
              ...whoami,
              claim_id: r.data.claim_id,
            });
          }
        }}
      >
        {({
          // TODO props commented out as example only
          // values,
          // errors,
          // touched,
          handleSubmit,
          // isSubmitting,
          // setFieldValue,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Button type="submit" disabled={submitClaim.isLoading}>
              {t("sampleForm.claimButton")}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
