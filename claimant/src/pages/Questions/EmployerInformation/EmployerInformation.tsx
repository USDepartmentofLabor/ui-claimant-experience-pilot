import { TFunction, Trans, useTranslation } from "react-i18next";
import { Alert } from "@trussworks/react-uswds";
import { EmployerProfile } from "../../../components/form/EmployerProfile/EmployerProfile";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import { IPageDefinition, IPreviousSegment } from "../../PageDefinitions";
import claimForm from "../../../i18n/en/claimForm";
import { yupPhone, yupAddress } from "../../../common/YupBuilder";
import * as yup from "yup";

// TODO: Validate that the number of employers matches the number of times that
//  the claimant has selected "LOCAL_more_employers"

const repeatable = (currentSegment: string | undefined, values: FormValues) => {
  if (!values["LOCAL_more_employers"]) {
    return false;
  }
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined
    ? values.LOCAL_more_employers[0] === true
    : values.LOCAL_more_employers[currentSegmentIdx] === true;
};

const nextSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  return currentSegment === undefined ? "1" : currentSegmentIdx + 1 + "";
};

const previousSegment = ({ segment: currentSegment }: IPreviousSegment) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  if (currentSegmentIdx - 1 < 0) {
    return false;
  } else {
    return currentSegmentIdx - 1 + "";
  }
};

export const EmployerInformation = (props: PageProps) => {
  const { t } = useTranslation("claimForm");
  const segment = props.segment || "0";

  return (
    <>
      {/*TODO: Display only for first segment? ("TBD" in figma)*/}
      <Alert type="info">
        <Trans ns="claimForm" i18nKey="employers.reason_for_data_collection">
          {/*TODO: Just include english text as default here as the docs do?*/}
          employers.reason_for_data_collection
        </Trans>
      </Alert>
      <EmployerProfile segment={segment} />
      <YesNoQuestion
        question={t("employers.more_employers.label")}
        id={`LOCAL_more_employers[${segment}]`}
        name={`LOCAL_more_employers[${segment}]`}
      />
    </>
  );
};

const yupEmployer = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    name: yup.string().max(255).required(t("employers.name.required")),
    address: yupAddress(t),
    first_work_date: yup
      .date()
      .required(t("employers.first_work_date.required")),
    phones: yup
      .array()
      .of(yupPhone(t))
      .when("LOCAL_same_phone", {
        is: false,
        then: yup.array().length(2).of(yupPhone(t)),
      })
      .when("LOCAL_same_phone", {
        is: true,
        then: yup.array().length(1).of(yupPhone(t)),
      }),
    LOCAL_same_phone: yup
      .boolean()
      .required(t("employers.same_phone.required")),
    LOCAL_same_address: yup
      .boolean()
      .required(t("employers.same_address.required")),
    work_site_address: yup
      .mixed()
      .when("LOCAL_same_address", { is: false, then: yupAddress(t) }),
    separation_reason: yup
      .string()
      .oneOf(Object.keys(claimForm.employers.separation.reasons))
      .max(64)
      .required(t("employers.separation.reason.required")),
    separation_option: yup
      .string()
      .max(64)
      .when("separation_reason", {
        is: (sep_reason: string) =>
          [
            "laid_off",
            "fired_discharged_terminated",
            "still_employed",
            "quit",
          ].includes(sep_reason),
        then: yup
          .string()
          .max(64)
          .required(t("employers.separation.option.required")),
      }),
    last_work_date: yup.date().when("separation_reason", {
      is: (sep_reason: string) => sep_reason !== "still_employed",
      then: yup.date().required(t("employers.last_work_date.required")),
    }),
    fein: yup
      .string()
      .nullable()
      .matches(/^(([0-9]{2}-?[0-9]{7})|)$/, t("employers.fein.pattern")),
    state_employer_payroll_number: yup.string(),
    self_employed: yup
      .boolean()
      .required(t("employers.self_employed.required")),
    separation_comment: yup.string().max(1024),
  });

// defined here to satisfy the IPageDefinition
// but we export so we can use it in EmployerReviewPage
export const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    LOCAL_more_employers: yup
      .array()
      .of(yup.boolean().required(t("employers.more_employers.required"))),
    employers: yup.array().of(yupEmployer(t)),
  });

const segmentSchema = (
  t: TFunction<"claimForm">,
  currentSegment: string | undefined
) => {
  const segment = parseInt(currentSegment || "0");
  return yup.object().shape({
    employers: yup
      .array()
      .of(yupEmployer(t))
      .transform((employers: Claim["employers"] = []) => {
        const modified = new Array(employers.length);
        modified[segment] = employers[segment];
        return modified;
      }),
    LOCAL_more_employers: yup
      .array()
      .of(yup.boolean())
      .transform((lme: Claim["LOCAL_more_employers"] = []) => {
        const modified = new Array(lme.length);
        modified[segment] = lme[segment];
        return modified;
      }),
  });
};
export const EmployerInformationPage: IPageDefinition = {
  path: "employer",
  heading: "recent_employer",
  initialValues: {
    employers: [],
    LOCAL_more_employers: [],
  },
  Component: EmployerInformation,
  repeatable,
  nextSegment,
  previousSegment,
  pageSchema,
  segmentSchema,
};
