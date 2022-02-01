import { useQueryClient } from "react-query";
import { Formik, Form, FormikHelpers } from "formik";
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
import PageLoader from "../../common/PageLoader";
import { useParams, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import claimFormStyles from "./ClaimForm.module.scss";
import {
  Button,
  FormGroup,
  StepIndicator,
  StepIndicatorStep,
} from "@trussworks/react-uswds";
import { pages } from "../PageDefinitions";
import { FormErrorSummary } from "../../components/form/FormErrorSummary/FormErrorSummary";

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
  const { t: formT } = useTranslation("claimForm");
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
    Component: CurrentPage,
    repeatable,
    nextSegment,
    previousSegment,
    pageSchema,
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
      <Link to={previousPageUrl()} className="usa-button usa-button--outline">
        {t("pagination.previous")}
      </Link>
    );

  const nextPageLink = () =>
    !claimCompleted() && (
      <Button disabled={submitClaim.isLoading} type="submit">
        {pages[currentPageIndex + 1] ? (
          <>{t("pagination.next")}</>
        ) : (
          t("sampleForm.claimButton")
        )}
      </Button>
    );

  const validationSchema = pageSchema(formT);

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

  const saveCurrentFormValues = async (currentValues: FormValues) => {
    if (!whoami) {
      return;
    }

    const claim: Claim = {
      ...currentValues,
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
  };

  const saveAndExit = async (currentValues: FormValues) => {
    const baseUrl = process.env.REACT_APP_BASE_URL || "";
    const logoutUrl = `${baseUrl}/logout/`;
    // save first, then navigate
    await saveCurrentFormValues(currentValues);
    window.location.href = logoutUrl;
  };

  const saveAndExitLink = (currentValues: FormValues) =>
    !claimCompleted() && (
      <Button type="button" onClick={() => saveAndExit(currentValues)} unstyled>
        {t("pagination.save_and_exit")}
      </Button>
    );

  const onSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>
  ) => {
    // navigate first, then fire the xhr call, so we display message on the next page.
    navigateToNextPage(values);
    saveCurrentFormValues(values);
    // Reset form to clear "submitted" status and prevent eager validations on all fields.
    resetForm({
      values,
      submitCount: 0,
      touched: {},
      errors: {},
      isValidating: false,
      isSubmitting: false,
    });
  };

  return (
    <div data-testid="claim-submission">
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(claimForm) => {
          const showError =
            claimForm.submitCount > 0 &&
            Object.keys(claimForm.errors).length > 0 &&
            Object.keys(claimForm.touched).length > 0;

          // Console.log any errors for debugging
          if (showError) console.log(claimForm.errors);

          return (
            <Form>
              {showError && (
                <FormErrorSummary
                  key={claimForm.submitCount}
                  errors={claimForm.errors}
                />
              )}
              <CurrentPage {...currentPageProps} />
              <div className={claimFormStyles.pagination}>
                <FormGroup>
                  <div className="text-center">
                    {previousPageLink()}
                    {nextPageLink()}
                    <div className="margin-top-1">
                      {saveAndExitLink(claimForm.values)}
                    </div>
                  </div>
                </FormGroup>
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
  const { t } = useTranslation("common", { keyPrefix: "page_headings" });
  const { page } = useParams();
  const currentPageIndex = pages.findIndex((p) => p.path === page);
  if (currentPageIndex === -1) {
    throw new Error("Page not found");
  }

  const getStatus = (index: number) => {
    if (index === currentPageIndex) return "current";
    if (index < currentPageIndex) return "complete";
    return undefined;
  };

  return (
    <main data-testid="claim-form-page" className="margin-top-5">
      <StepIndicator counters="small" headingLevel="h1">
        {pages.map((page, i) => (
          <StepIndicatorStep
            key={page.path}
            label={t(page.heading)}
            status={getStatus(i)}
          />
        ))}
      </StepIndicator>
      <RequestErrorBoundary>
        <ClaimForm />
      </RequestErrorBoundary>
    </main>
  );
};

export default ClaimFormPage;
