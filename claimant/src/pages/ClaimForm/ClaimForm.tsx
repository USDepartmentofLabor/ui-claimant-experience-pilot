import { useQueryClient } from "react-query";
import { Formik, Form, FormikHelpers, FormikProps } from "formik";
import { useWhoAmI } from "../../queries/whoami";
import { RequestErrorBoundary } from "../../queries/RequestErrorBoundary";
import { useSubmitClaim, useGetPartialClaim } from "../../queries/claim";
import {
  getInitialValuesFromPageDefinitions,
  initializeClaimFormWithWhoAmI,
  mergeClaimFormValues,
} from "../../utils/claim_form";
import { useTranslation } from "react-i18next";
import PageLoader from "../../common/PageLoader";
import { useParams, useNavigate } from "react-router";
import claimFormStyles from "./ClaimForm.module.scss";
import {
  Button,
  FormGroup,
  StepIndicator,
  StepIndicatorStep,
} from "@trussworks/react-uswds";
import { pages } from "../PageDefinitions";
import { FormErrorSummary } from "../../components/form/FormErrorSummary/FormErrorSummary";
import { ClaimFormPageHeading } from "../../components/ClaimFormHeading/ClaimFormPageHeading";
import { Routes } from "../../routes";

const BYPASS_PARTIAL_RESTORE =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_BYPASS_PARTIAL_CLAIM_RESTORE === "true";

// ClaimForm == /claimant/claim/
export const ClaimForm = () => {
  const { page, segment } = useParams();
  const { data: whoami, error, isFetched: whoamiIsFetched } = useWhoAmI();
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { t } = useTranslation("home"); // todo claim_form once i18n re-orged
  const { t: formT } = useTranslation("claimForm");
  const navigate = useNavigate();

  const {
    data: partialClaimResponse,
    error: partialClaimError,
    isLoading: partialClaimIsLoading,
  } = useGetPartialClaim();

  const currentPageIndex = pages.findIndex((p) => p.path === page);

  if (!whoamiIsFetched) {
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
    segmentSchema,
    path: currentPagePath,
  } = pages[currentPageIndex];

  const navigateToNextPage = (values: FormValues) => {
    let nextPage;
    if (repeatable) {
      if (repeatable(segment, values) && nextSegment) {
        nextPage = `/claim/${currentPagePath}/${nextSegment(segment)}/`;
      }
    }
    if (!nextPage && pages[currentPageIndex + 1]) {
      nextPage = `/claim/${pages[currentPageIndex + 1].path}`;
    }
    if (nextPage) {
      navigate(nextPage);
    }
  };

  const previousPageUrl = (values: ClaimantInput) => {
    if (repeatable && previousSegment) {
      const previousSegmentPath = previousSegment({ segment });
      if (previousSegmentPath) {
        return `/claim/${currentPagePath}/${previousSegmentPath}/`;
      }
    } else if (previousSegment) {
      const previousPage = previousSegment({ values });
      if (previousPage) {
        return previousPage;
      }
    }
    return `/claim/${pages[currentPageIndex - 1].path}`;
  };

  const navigateToPreviousPage = (claimForm: FormikProps<FormValues>) => {
    const previousPage = previousPageUrl(claimForm.values);
    saveCurrentFormValues(claimForm.values);
    submitClaim.reset();
    navigate(previousPage);
    claimForm.resetForm({
      submitCount: 0,
      touched: {},
      errors: {},
      isValidating: false,
      isSubmitting: false,
    });
  };

  const previousPageLink = (claimForm: FormikProps<FormValues>) =>
    !claimCompleted() &&
    pages[currentPageIndex - 1] && (
      <Button
        type="button"
        data-testid="back-button"
        onClick={() => navigateToPreviousPage(claimForm)}
        className="usa-button usa-button--outline width-auto"
      >
        {t("pagination.previous")}
      </Button>
    );

  const nextPageLink = () =>
    !claimCompleted() && (
      <Button
        className="width-auto"
        disabled={submitClaim.isLoading}
        type="submit"
        data-testid="next-button"
      >
        {pages[currentPageIndex + 1] ? (
          <>{t("pagination.next")}</>
        ) : (
          t("pagination.complete")
        )}
      </Button>
    );

  const validationSchema = segmentSchema
    ? segmentSchema(formT, segment)
    : pageSchema(formT);

  const claimCompleted = () => {
    return submitClaim.isSuccess && submitClaim.data.status === 201;
  };

  if (partialClaimIsLoading) {
    return <PageLoader />;
  }

  if (partialClaimError) {
    throw partialClaimError;
  }

  const partialClaim =
    partialClaimResponse?.claim || queryClient.getQueryData("getPartialClaim");

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
      swa_code: whoami.swa.code,
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
    if (claim.legal_affirmation) {
      navigate(`${Routes.HOME_PAGE}`);
    } else {
      queryClient.setQueryData("getPartialClaim", {
        ...partialClaimResponse,
        claim,
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
      <Button
        className="width-auto"
        type="button"
        onClick={() => saveAndExit(currentValues)}
        unstyled
        data-testid="save-and-exit-button"
      >
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
          // if (showError) console.log(claimForm.errors);

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
                    {previousPageLink(claimForm)}
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

  const step = currentPageIndex + 1;
  const totalSteps = pages.length;

  return (
    <div className="display-flex flex-column margin-top-5">
      <StepIndicator
        className="overflow-hidden"
        counters="none"
        headingLevel="h2"
        divProps={{
          role: "region",
          "aria-label": `progress - step ${step} of ${totalSteps}`,
        }}
      >
        {pages.map((page, i) => (
          <StepIndicatorStep
            key={page.path}
            label={t(page.heading)}
            status={getStatus(i)}
          />
        ))}
      </StepIndicator>
      <main className="tablet:width-mobile-lg margin-x-auto" id="main-content">
        <RequestErrorBoundary>
          <ClaimFormPageHeading
            pageHeading={t(`${pages[currentPageIndex].heading}`)}
            step={step}
            totalSteps={totalSteps}
          />
          <ClaimForm />
        </RequestErrorBoundary>
      </main>
    </div>
  );
};

export default ClaimFormPage;
