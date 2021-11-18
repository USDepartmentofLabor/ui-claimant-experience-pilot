import { useQueryClient } from "react-query";
import { Formik, Form } from "formik";
import { Button } from "@trussworks/react-uswds";
import TextField from "../../components/form/fields/TextField";
import HomeStyles from "./Home.module.scss";
import { useWhoAmI } from "../../queries/whoami";
import { useSubmitClaim } from "../../queries/claim";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

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

// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
const initialValues: { [key: string]: string | undefined } = {
  first_name: "",
  email: "",
  birthdate: "",
  ssn: "",
  last_name: "",
  phone: "",
};

export const ClaimForm = () => {
  const { data: whoami, error, isLoading } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home");

  // Yup validation schema for this page ONLY.
  // Yup supports its own i18n but it seems redundant?
  // https://github.com/jquense/yup#using-a-custom-locale-dictionary
  const validationSchema = yup.object().shape({
    first_name: yup.string().required(t("validation.required")),
    email: yup.string().email(t("validation.notEmail")),
    birthdate: yup.string().required(t("validation.required")),
    ssn: yup.string().required(t("validation.required")),
  });

  if (whoami) {
    for (const [key, value] of Object.entries(whoami)) {
      if (value && key in initialValues && !initialValues[key]) {
        initialValues[key] = value;
      }
    }
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || submitClaim.error || !whoami) {
    throw error || submitClaim.error;
  }

  return (
    <div data-testid="claim-submission">
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
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values) => {
          if (!whoami) {
            return;
          }
          const claim: Claim = {
            ...values,
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
        {() => (
          //{(props: FormikProps<ClaimantInput>) => (
          <Form>
            <TextField
              name="first_name"
              label={t("label.first_name")}
              type="text"
              id="first_name"
            />
            <TextField
              name="email"
              label={t("label.email")}
              type="email"
              id="email"
            />
            <TextField
              name="birthdate"
              label={t("label.birthdate")}
              type="text"
              id="birthdate"
            />
            <TextField name="ssn" label={t("label.ssn")} type="text" id="ssn" />
            <Button type="submit" disabled={submitClaim.isLoading}>
              {t("sampleForm.claimButton")}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
};
