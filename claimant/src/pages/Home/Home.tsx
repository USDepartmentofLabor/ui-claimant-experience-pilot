import { useQueryClient } from "react-query";
import { Formik, Form, FormikErrors } from "formik";
import { useWhoAmI } from "../../queries/whoami";
import { useSubmitClaim } from "../../queries/claim";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useTranslation } from "react-i18next";
import YupBuilder from "../../common/YupBuilder";
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

interface FormValues {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  [key: string]: string | boolean | any;
}

// The _entire_ claimant data, even if rendering a subset.
// These values are empty strings on the first load, but might
// be persisted somewhere and restored on later visits.
const initialValues: FormValues = {
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
    !claimCompleted() &&
    pages[currentPageIndex - 1] && (
      <Link
        to={`/claim/${pages[currentPageIndex - 1].path}`}
        className="usa-button"
      >
        &laquo; {t("pagination.previous")}
      </Link>
    );

  const nextPageLink = (
    validateForm: () => Promise<FormikErrors<FormValues>>,
    submitForm: () => Promise<void>
  ) =>
    !claimCompleted() &&
    pages[currentPageIndex + 1] && (
      <Button
        type="submit"
        onClick={() => {
          validateForm().then((errors) => {
            if (Object.keys(errors).length === 0) {
              submitForm();
              navigate(`/claim/${pages[currentPageIndex + 1].path}`);
            }
          });
        }}
      >
        {t("pagination.next")} &raquo;
      </Button>
    );

  const validationSchema = YupBuilder("claim-v1.0", currentPage.fields);

  const claimCompleted = () => {
    return submitClaim.isSuccess && submitClaim.data.status === 201;
  };

  if (whoami) {
    // TODO more elegant way to populate this?
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
        {({ validateForm, submitForm }) => (
          //{(props: FormikProps<ClaimantInput>) => (
          <Form>
            {currentPage.render()}
            <div className={homeStyles.pagination}>
              {previousPageLink()}
              {nextPageLink(validateForm, submitForm)}
            </div>
          </Form>
        )}
      </Formik>
      {submitClaim.isSuccess ? (
        // TODO probably want to hide the "Progress saved" after a few seconds so
        // not to confuse users with "which progress" from one page to the next.
        <div className="usa-alert usa-alert--success">
          <div className="usa-alert__body">
            <h4 className="usa-alert__heading">Success status</h4>
            {claimCompleted() ? (
              <p className="usa-alert__text">
                {t("sampleForm.claimSuccess")} <code>{whoami.claim_id}</code>
              </p>
            ) : (
              <p className="usa-alert__text">Progress saved</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
