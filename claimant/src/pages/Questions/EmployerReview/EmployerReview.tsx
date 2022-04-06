import { EmployerProfileReview } from "../../../components/form/EmployerProfile/EmployerProfileReview";
import { pageSchema } from "../EmployerInformation/EmployerInformation";
import { IPageDefinition, IPreviousSegment } from "../../PageDefinitions";
import { useSubmitClaim } from "../../../queries/claim";
import { useWhoAmI } from "../../../queries/whoami";
import { useQueryClient } from "react-query";
import { NavLink } from "react-router-dom";
import { Button, FormGroup } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useTranslation, Trans } from "react-i18next";
import { ValidationError } from "yup";

type SegmentError = number;

const ERRORS_IN_AN_EMPTY_EMPLOYER_RECORD = 10;

const getSegmentErrors = (values: FormValues) => {
  const { t } = useTranslation("common");
  const segmentErrors: SegmentError[] = [];
  for (const [idx] of values.employers.entries()) {
    try {
      pageSchema(t).validateSyncAt(`employers[${idx}]`, values, {
        abortEarly: false,
      });
      segmentErrors.push(0);
    } catch (yupError) {
      if (yupError instanceof ValidationError) {
        // count the field paths so that math works similarly to how Formik counts.
        const errPaths: string[] = [];
        if (yupError.inner.length === 0) {
          segmentErrors.push(1);
        } else {
          for (const err of yupError.inner) {
            if (!errPaths.includes(err.path || "")) {
              errPaths.push(err.path || "");
            }
          }
          segmentErrors.push(errPaths.length);
        }
      } else {
        throw yupError;
      }
    }
  }
  for (const [idx] of values.LOCAL_more_employers.entries()) {
    try {
      pageSchema(t).validateSyncAt(`LOCAL_more_employers[${idx}]`, values, {
        abortEarly: false,
      });
    } catch (yupError) {
      if (yupError instanceof ValidationError) {
        segmentErrors[idx]++;
      } else {
        throw yupError;
      }
    }
  }
  return segmentErrors;
};

const employerLooksEmpty = (
  employer: EmployerType | undefined,
  errCount: number
) => {
  if (!employer) {
    return true;
  }
  const nameExists = employer.name;
  if (errCount > ERRORS_IN_AN_EMPTY_EMPLOYER_RECORD && !nameExists) {
    return true;
  }
  return false;
};

const previousPageUrl = ({ values }: IPreviousSegment) => {
  const employers = values?.employers;
  if (employers && employers.length) {
    return `/claim/employer/${employers.length - 1}`;
  } else {
    return "/claim/employer";
  }
};

export const EmployerReview = () => {
  const { values, resetForm } = useFormikContext<ClaimantInput>();
  const { t } = useTranslation("common");
  const { t: formT } = useTranslation("claimForm");
  const submitClaim = useSubmitClaim();
  const queryClient = useQueryClient();
  const { data: whoami, isFetched: whoamiIsFetched } = useWhoAmI();

  const removeEmployer = async (...indices: number[]) => {
    if (!whoami) {
      return;
    }
    const employers = values.employers?.filter((_, i) => !indices.includes(i));
    const LOCAL_more_employers = values.LOCAL_more_employers?.filter(
      (_, i) => !indices.includes(i)
    );
    // must toggle the LOCAL_more_employers for the "last" to always be "false"
    if (LOCAL_more_employers && LOCAL_more_employers.length) {
      LOCAL_more_employers[LOCAL_more_employers.length - 1] = false;
    }
    const newValues = {
      ...values,
      employers,
      LOCAL_more_employers,
    };
    const claim: Claim = {
      ...newValues,
      swa_code: whoami.swa.code,
      claimant_id: whoami.claimant_id,
    };
    await submitClaim.mutateAsync(claim);
    // bust the cache to force re-fetch
    queryClient.invalidateQueries("getPartialClaim");
    resetForm({ values: newValues });
  };

  const nextEmployerSegment = values.employers?.length || 0;
  const segmentErrors: SegmentError[] = getSegmentErrors(values);

  // if any of the segment errors suggest an "empty" employer (as from navigation side-effect)
  // then quietly remove it.
  const employersToRemove: number[] = [];
  segmentErrors.forEach((errCount, idx) => {
    const employer = values.employers?.[idx];
    if (employerLooksEmpty(employer, errCount)) {
      employersToRemove.push(idx);
    }
  });
  if (employersToRemove.length) {
    removeEmployer(...employersToRemove);
  }

  if (!whoamiIsFetched) {
    return <></>;
  }

  return (
    <>
      <div className="usa-summary-box margin-bottom-6">
        <div className="usa-summary-box__body">
          <div className="usa-summary-box__text">
            <Trans t={formT} i18nKey="employers.reason_for_data_collection" />
          </div>
        </div>
      </div>
      {values.employers?.map((employer, idx) => (
        <FormGroup error={!!segmentErrors[idx]} key={`employer-${idx}`}>
          {/* TODO replace this with the Employer Review component used in the review page */}
          <EmployerProfileReview employer={employer} />
          <NavLink
            to={`/claim/employer/${idx}`}
            aria-label={`${t("edit")} ${employer.name}`}
          >
            {segmentErrors[idx] ? (
              <strong>
                {segmentErrors[idx] > 1
                  ? t("fix_multiple_errors", { errCount: segmentErrors[idx] })
                  : t("fix_one_error")}
              </strong>
            ) : (
              t("edit")
            )}
          </NavLink>
          <Button
            type="button"
            className="margin-left-3 text-secondary"
            unstyled
            onClick={() => removeEmployer(idx)}
            aria-label={`${t("remove")} ${employer.name}`}
          >
            {t("remove")}
          </Button>
        </FormGroup>
      ))}
      <div className="margin-top-3">
        <NavLink to={`/claim/employer/${nextEmployerSegment}`}>
          {t("add_another_employer")}
        </NavLink>
      </div>
    </>
  );
};

export const EmployerReviewPage: IPageDefinition = {
  path: "employer-review",
  heading: "employer_review",
  initialValues: {},
  Component: EmployerReview,
  pageSchema,
  previousSegment: previousPageUrl,
};
