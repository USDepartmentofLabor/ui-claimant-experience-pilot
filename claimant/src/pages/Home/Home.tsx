import { useQueryClient } from "react-query";
import { Formik, Form } from "formik";
import { useWhoAmI } from "../../queries/whoami";
import { useSubmitClaim } from "../../queries/claim";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";
import * as yup from "yup";

import PageLoader from "../../common/PageLoader";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import homeStyles from "./Home.module.scss";
import { Button } from "@trussworks/react-uswds";
import { getPages } from "../PageDefinition";

const HomePage = () => {
  const { t } = useTranslation("home");
  const { page } = useParams();

  return (
    <main>
      <h1>{t("welcome")}</h1>
      <p className="usa-intro">{t("intro")}</p>
      <RequestErrorBoundary>
        <ClaimForm page={page} />
      </RequestErrorBoundary>
    </main>
  );
};

export default HomePage;

// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const initialValues: { [key: string]: string | boolean | any } = {
  is_complete: false,
  claimant_name: { first_name: "", last_name: "" },
  email: "",
  birthdate: "",
  ssn: "",
  phone: "",
};

export const ClaimForm = ({ page }: { page: string | undefined }) => {
  const { data: whoami, error, isLoading } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home");
  const navigate = useNavigate();

  const pages = getPages({ submitClaim });

  const currentPageIndex = pages.findIndex((p) => p.path === page);

  if (currentPageIndex === -1) {
    throw new Error("Page not found");
  }

  const currentPage = pages[currentPageIndex];

  const previousPageLink = () =>
    pages[currentPageIndex - 1] && (
      <Link
        to={`/claim/${pages[currentPageIndex - 1].path}`}
        className="usa-button"
      >
        &laquo; {t("pagination.previous")}
      </Link>
    );

  const nextPageLink = (submitForm: () => Promise<void>) =>
    pages[currentPageIndex + 1] && (
      <Button
        type="submit"
        onClick={() => {
          submitForm();
          navigate(`/claim/${pages[currentPageIndex + 1].path}`);
        }}
      >
        {t("pagination.next")} &raquo;
      </Button>
    );

  // Yup validation schema for this page ONLY.
  // Yup supports its own i18n but it seems redundant?
  // https://github.com/jquense/yup#using-a-custom-locale-dictionary
  const validationSchema = yup.object().shape({
    claimant_name: yup.object().shape({
      first_name: yup.string().required(t("validation.required")),
      last_name: yup.string().required(t("validation.required")),
    }),
    email: yup.string().email(t("validation.notEmail")),
    birthdate: yup.string().required(t("validation.required")),
    ssn: yup.string().required(t("validation.required")),
  });

  if (whoami) {
    for (const [key, value] of Object.entries(whoami)) {
      if (key === "first_name" || key === "last_name") {
        initialValues.claimant_name[key] = value;
      } else if (value && key in initialValues && !initialValues[key]) {
        initialValues[key] = value;
      }
    }
  }

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !whoami) {
    throw error;
  }

  return (
    <div data-testid="claim-submission">
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
        {({ submitForm }) => (
          //{(props: FormikProps<ClaimantInput>) => (
          <Form>
            {currentPage.render()}
            <div className={homeStyles.pagination}>
              {previousPageLink()}
              {nextPageLink(submitForm)}
            </div>
          </Form>
        )}
      </Formik>
      {submitClaim.isSuccess ? (
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Success status</h4>
            {submitClaim.data.status === 201 ? (
              <p className="usa-alert__text">
                {t("sampleForm.claimSuccess")} <code>{whoami.claim_id}</code>
              </p>
            ) : (
              <p className="usa-alert__text">Ready for next page</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
