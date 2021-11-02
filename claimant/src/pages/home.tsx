import { useQueryClient } from "react-query";
import { useFormik } from "formik";
import {
  Button,
  Form,
  FormGroup,
  TextInput,
  Label,
  ErrorMessage,
} from "@trussworks/react-uswds";
import HomeStyles from "./Home.module.scss";
import { useWhoAmI } from "../queries/whoami";
import { useSubmitClaim } from "../queries/claim";
import { RequestErrorBoundary } from "../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";

import PageLoader from "../common/PageLoader";

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
const initialValues = {
  firstName: "",
  email: "",
};

const ClaimForm = () => {
  const { data: whoami, error, isLoading } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home");

  // Validation rules for the fields we're rendering on this page only.
  // Could be done with Yup but it's not clear that's easier.
  const validate = (values: typeof initialValues) => {
    const errors = {} as Partial<typeof initialValues>;
    if (!values.firstName) {
      errors.firstName = t("validation.required");
    }
    if (!/@/.test(values.email)) {
      errors.email = t("validation.notEmail");
    }
    return errors;
  };

  // TODO: Put in a common-to-all-pages location
  const formik = useFormik({
    initialValues,
    validate,
    onSubmit: async (values) => {
      if (!whoami) {
        return;
      }
      const claim: Claim = {
        ...values,
        swa_code: whoami.swa_code,
        claimant_id: whoami.claimant_id,
      };
      console.log(claim);
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
    },
  });

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
      <Form onSubmit={formik.handleSubmit}>
        {/* TODO: create reusable FormGroup+Label+TextInput+ErrorMessage component*/}
        <FormGroup>
          <Label htmlFor="firstName">{t("label.firstName")}</Label>
          <TextInput
            type="text"
            id="firstName"
            name="firstName"
            error={!!formik.errors.firstName}
            value={formik.values.firstName}
            onChange={formik.handleChange}
          />
          {formik.errors.firstName && (
            <ErrorMessage>{formik.errors.firstName}</ErrorMessage>
          )}
        </FormGroup>
        <FormGroup>
          <Label htmlFor="email">{t("label.email")}</Label>
          <TextInput
            type="text"
            id="email"
            name="email"
            error={!!formik.errors.email}
            value={formik.values.email}
            onChange={formik.handleChange}
          />
          {formik.errors.email && (
            <ErrorMessage>{formik.errors.email}</ErrorMessage>
          )}
        </FormGroup>
        <Button type="submit" disabled={submitClaim.isLoading}>
          {t("sampleForm.claimButton")}
        </Button>
      </Form>
    </div>
  );
};
