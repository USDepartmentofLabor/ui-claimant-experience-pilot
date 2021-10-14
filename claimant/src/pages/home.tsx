import { Formik } from "formik";
import { Button, Form } from "@trussworks/react-uswds";
import HomeStyles from "./Home.module.scss";
import { useWhoAmI } from "../queries/whoami";
import { useSendEmail } from "../queries/claim";
import { RequestErrorBoundary } from "../queries/RequestErrorBoundary";

const HomePage = () => {
  return (
    <main>
      <h1>Welcome</h1>
      <p className="usa-intro">File an unemployment insurance claim.</p>
      <section className="usa-section">
        <p className={HomeStyles.hello}>Hello from a CSS Module style</p>
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
  const sendEmail = useSendEmail();

  if (isLoading) {
    return <>Loading</>;
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
            Test Email
          </Button>
        </Form>
      )}
    </Formik>
  );
};
