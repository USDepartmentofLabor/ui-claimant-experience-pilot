import { Formik } from "formik";
import { Button, Form } from "@trussworks/react-uswds";

import { useWhoAmI } from "../queries/whoami";
import { RequestWrapper } from "../queries/RequestWrapper";
import { useSendEmail } from "../queries/claim";

const HomePage = () => {
  return (
    <main>
      <h1>Welcome</h1>
      <p className="usa-intro">File an unemployment insurance claim.</p>
      <RequestWrapper>
        <ClaimForm />
      </RequestWrapper>
    </main>
  );
};

export default HomePage;

const ClaimForm = () => {
  const { data: whoami } = useWhoAmI();
  const sendEmail = useSendEmail();

  if (!whoami) {
    return <></>;
  }

  if (sendEmail.error) {
    throw sendEmail.error;
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
