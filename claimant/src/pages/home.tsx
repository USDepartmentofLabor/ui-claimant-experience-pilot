import React from 'react';
import { Formik } from 'formik';
import Cookies from 'universal-cookie';
import {
  Button,
  Form,
} from '@trussworks/react-uswds';

import httpclient from "../utils/httpclient";

type Props = {
  whoami: WhoAmI
}

const HomePage: React.FC<Props> = (props) => {
  const { whoami } = props;

  return (
    <main>
      <h1>Welcome</h1>

      <p className="usa-intro">File an unemployment insurance claim.</p>

      <Formik
        initialValues={{}}
        onSubmit={(values, { setSubmitting }) => {
          setSubmitting(true);
          console.log("submit!", { values, whoami });
          const cookies = new Cookies();
          const csrftoken = cookies.get('csrftoken');
          httpclient
            .post("/api/claim/", values, { withCredentials: true, headers: { "X-CSRFToken": csrftoken, "Content-Type": "application/json", } })
            .then((resp) => {
              console.log("then", resp);

              if (resp && resp.data) {
                alert(`Email sent to ${whoami.email}`);
                setSubmitting(false);
              }
            })
            .catch((err) => {
              console.error(err);
              setSubmitting(false);
            });
        }}>
        {({
          // TODO props commented out as example only
          // values,
          // errors,
          // touched,
          handleSubmit,
          isSubmitting,
          // setFieldValue,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Button type="submit" disabled={isSubmitting}>Test Email</Button>
          </Form>
        )}
      </Formik>
    </main>
  );
};

export default HomePage;
