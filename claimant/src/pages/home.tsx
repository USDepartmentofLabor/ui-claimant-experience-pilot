import { Formik } from "formik";
import { Button, Form } from "@trussworks/react-uswds";
import HomeStyles from "./Home.module.scss";
import { useWhoAmI } from "../queries/whoami";
import { useSendEmail } from "../queries/claim";
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

const ClaimForm = () => {
  const { data: whoami, error, isLoading } = useWhoAmI();
  const { t } = useTranslation("home");

  const sendEmail = useSendEmail();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || sendEmail.error || !whoami) {
    throw error || sendEmail.error;
  }

  return (
    <Formik
      initialValues={{}}
      onSubmit={async () => {
        await sendEmail.mutateAsync();
        alert(`Email sent to ${whoami.email}`);
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
          <Button type="submit" disabled={sendEmail.isLoading}>
            {t("sampleForm.emailButton")}
          </Button>
        </Form>
      )}
    </Formik>
  );
};
