import { useQueryClient } from "react-query";
import { Formik, Form } from "formik";
import { useWhoAmI } from "../../queries/whoami";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import {
  useSubmitClaim,
  useGetPartialClaim,
  useGetCompletedClaim,
} from "../../queries/claim";
import {
  initializeClaimFormWithWhoAmI,
  mergeClaimFormValues,
} from "../../utils/claim_form";
import { Trans, useTranslation } from "react-i18next";
import YupBuilder from "../../common/YupBuilder";
import * as yup from "yup";
import PageLoader from "../../common/PageLoader";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import claimFormStyles from "./ClaimForm.module.scss";
import { Button } from "@trussworks/react-uswds";
import { pages } from "../PageDefinition";
import claim_v1_0 from "../../schemas/claim-v1.0.json";

const BYPASS_PARTIAL_RESTORE =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_PARTIAL_CLAIM_RESTORE === "true";
const BYPASS_COMPLETED_CHECK =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_COMPLETED_CLAIM_CHECK === "true";

// ClaimForm == /claimant/claim/
export const ClaimForm = () => {
  const { data: whoami, error, isFetched: whoamiIsFetched } = useWhoAmI();
  const { page } = useParams();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home"); // todo claim_form once i18n re-orged
  const navigate = useNavigate();

  const { data: completedClaim, isFetched: completedClaimIsFetched } =
    useGetCompletedClaim();

  const {
    data: partialClaim,
    error: partialClaimError,
    isLoading: partialClaimIsLoading,
  } = useGetPartialClaim();

  const currentPageIndex = pages.findIndex((p) => p.path === page);

  if (!whoamiIsFetched || !completedClaimIsFetched) {
    return <PageLoader />;
  }

  if (currentPageIndex === -1) {
    throw new Error("Page not found");
  }

  if (error || !whoami) {
    throw error;
  }

  const {
    schemaFields,
    Component: CurrentPage,
    additionalValidations,
  } = pages[currentPageIndex];

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

  const nextPageLink = () =>
    !claimCompleted() && (
      <Button disabled={submitClaim.isLoading} type="submit">
        {pages[currentPageIndex + 1] ? (
          <>{t("pagination.next")} &raquo;</>
        ) : (
          t("sampleForm.claimButton")
        )}
      </Button>
    );

  const jsonValidationSchema = YupBuilder("claim-v1.0", schemaFields);
  const validationSchema =
    additionalValidations && jsonValidationSchema
      ? yup.object().shape(additionalValidations).concat(jsonValidationSchema)
      : jsonValidationSchema;

  const claimCompleted = () => {
    return submitClaim.isSuccess && submitClaim.data.status === 201;
  };

  if (!BYPASS_COMPLETED_CHECK && completedClaim?.status === 200) {
    return (
      <Trans
        t={t}
        i18nKey="claimAlreadySubmitted"
        values={{
          swaName: whoami.swa_name,
          swaClaimantUrl: whoami.swa_claimant_url,
        }}
        components={[
          <a href={whoami.swa_claimant_url} key={whoami.swa_code}>
            {whoami.swa_claimant_url}
          </a>,
        ]}
      />
    );
  }

  if (partialClaimIsLoading) {
    return <PageLoader />;
  }

  if (partialClaimError) {
    throw partialClaimError;
  }

  let initialValues: FormValues = {};

  if (BYPASS_PARTIAL_RESTORE) {
    initialValues = initializeClaimFormWithWhoAmI(whoami);
  } else {
    initialValues = mergeClaimFormValues(
      initializeClaimFormWithWhoAmI(whoami),
      /* we know partialClaim is defined at this point */
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      partialClaim!
    );
  }

  if (!Object.keys(initialValues)) {
    throw new Error("no initialValues");
  }

  return (
    <div data-testid="claim-submission">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values: FormValues) => {
          if (pages[currentPageIndex + 1]) {
            navigate(`/claim/${pages[currentPageIndex + 1].path}`);
          }

          if (!whoami) {
            return;
          }

          //Only send the Formik values that map to values in the JSON Schema
          const schemaValues = Object.keys(values)
            .filter((key) => Object.keys(claim_v1_0.properties).includes(key))
            .reduce(
              (res, key) => Object.assign(res, { [key]: values[key] }),
              {}
            );
          const claim: Claim = {
            ...schemaValues,
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
        {(errors) => {
          // TODO leaving this here for now to help us all understand schema validation problems.
          console.warn({ errors });
          //{(props: FormikProps<ClaimantInput>) => (
          return (
            <Form>
              <CurrentPage />
              <div className={claimFormStyles.pagination}>
                {previousPageLink()}
                {nextPageLink()}
              </div>
            </Form>
          );
        }}
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

const ClaimFormPage = () => {
  const { t } = useTranslation("home"); // TODO
  return (
    <main data-testid="claim-form-page">
      <h1>{t("welcome")}</h1>
      <RequestErrorBoundary>
        <ClaimForm />
      </RequestErrorBoundary>
    </main>
  );
};

export default ClaimFormPage;
