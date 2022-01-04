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
  getInitialValuesFromPageDefinitions,
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
import { Button, ErrorMessage, FormGroup } from "@trussworks/react-uswds";
import { pages } from "../PageDefinitions";
import claim_v1_0 from "../../schemas/claim-v1.0.json";

const BYPASS_PARTIAL_RESTORE =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_PARTIAL_CLAIM_RESTORE === "true";
const BYPASS_COMPLETED_CHECK =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_COMPLETED_CLAIM_CHECK === "true";

// ClaimForm == /claimant/claim/
export const ClaimForm = () => {
  const { page, segment } = useParams();
  const { data: whoami, error, isFetched: whoamiIsFetched } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home"); // todo claim_form once i18n re-orged
  const { t: commonT } = useTranslation("common");
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
    repeatable,
    nextSegment,
    previousSegment,
  } = pages[currentPageIndex];

  const navigateToNextPage = (values: FormValues) => {
    let nextPage;
    if (repeatable) {
      if (repeatable(segment, values) && nextSegment) {
        nextPage = `/claim/${pages[currentPageIndex].path}/${nextSegment(
          segment
        )}/`;
      }
    }
    if (!nextPage && pages[currentPageIndex + 1]) {
      nextPage = `/claim/${pages[currentPageIndex + 1].path}`;
    }
    if (nextPage) {
      navigate(nextPage);
    }
  };

  const previousPageUrl = () => {
    if (repeatable && previousSegment) {
      const previousPage = previousSegment(segment);
      if (previousPage) {
        return `/claim/${pages[currentPageIndex].path}/${previousPage}/`;
      }
    }
    return `/claim/${pages[currentPageIndex - 1].path}`;
  };

  const previousPageLink = () =>
    !claimCompleted() &&
    pages[currentPageIndex - 1] && (
      <Link to={previousPageUrl()} className="usa-button">
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

  let initialValues: FormValues = getInitialValuesFromPageDefinitions(pages);

  if (BYPASS_PARTIAL_RESTORE) {
    initialValues = initializeClaimFormWithWhoAmI(initialValues, whoami);
  } else {
    initialValues = mergeClaimFormValues(
      initializeClaimFormWithWhoAmI(initialValues, whoami),
      /* we know partialClaim is defined at this point */
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      partialClaim!
    );
  }

  if (!Object.keys(initialValues)) {
    throw new Error("no initialValues");
  }

  const currentPageProps: PageProps = {
    segment,
  };

  return (
    <div data-testid="claim-submission">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={async (values: FormValues) => {
          navigateToNextPage(values);

          if (!whoami) {
            return;
          }

          //Only send the Formik values that map to values in the JSON Schema
          // TODO recurse for employers and other arrays
          // TODO filter out anything starting with LOCAL_
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
          const currentPageErrors =
            errors && Object.keys(errors.errors).length ? true : false;
          if (errors && Object.keys(errors.errors).length) {
            console.log({ errors: errors.errors });
          }
          //{(props: FormikProps<ClaimantInput>) => (
          return (
            <Form>
              <CurrentPage {...currentPageProps} />
              <div className={claimFormStyles.pagination}>
                <FormGroup error={currentPageErrors}>
                  {previousPageLink()}
                  {nextPageLink()}
                </FormGroup>
                {currentPageErrors && (
                  <ErrorMessage>{commonT("form_errors")}</ErrorMessage>
                )}
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
