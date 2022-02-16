import { EmployerProfileReview } from "../../../components/form/EmployerProfile/EmployerProfileReview";
import { pageSchema } from "../EmployerInformation/EmployerInformation";
import { IPageDefinition, IPreviousSegment } from "../../PageDefinitions";
import { NavLink } from "react-router-dom";
import { Button, FormGroup } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { useTranslation } from "react-i18next";
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
  const { values, setValues } = useFormikContext<ClaimantInput>();
  const { t } = useTranslation("common");

  const removeEmployer = (...indices: number[]) => {
    const employers = values.employers?.filter((_, i) => !indices.includes(i));
    const LOCAL_more_employers = values.LOCAL_more_employers?.filter(
      (_, i) => !indices.includes(i)
    );
    setValues((form) => ({
      ...form,
      employers,
      LOCAL_more_employers,
    }));
  };

  const nextEmployerSegment = values.employers?.length || 0;
  const segmentErrors: SegmentError[] = getSegmentErrors(values);

  // if any of the segment errors suggest an "empty" employer (as from navigation side-effect)
  // then quietly remove it.
  const employersToRemove: number[] = [];
  segmentErrors.forEach((errCount, idx) => {
    const employer = values.employers?.at(idx);
    if (employerLooksEmpty(employer, errCount)) {
      employersToRemove.push(idx);
    }
  });
  if (employersToRemove.length) {
    removeEmployer(...employersToRemove);
  }

  return (
    <>
      {values.employers?.map((employer, idx) => (
        <FormGroup error={!!segmentErrors[idx]} key={`employer-${idx}`}>
          <EmployerProfileReview employer={employer} />
          <NavLink to={`/claim/employer/${idx}`}>
            {segmentErrors[idx] ? (
              <strong>
                {segmentErrors[idx] > 1
                  ? t("fix_multiple_errors", { errCount: segmentErrors[idx] })
                  : t("fix_one_error")}
              </strong>
            ) : (
              t("edit_details")
            )}
          </NavLink>
          <Button
            type="button"
            className="margin-left-1"
            secondary
            onClick={() => removeEmployer(idx)}
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
