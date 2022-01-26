import { TFunction, Trans, useTranslation } from "react-i18next";
import { Alert, Button, Fieldset } from "@trussworks/react-uswds";
import { EmployerProfile } from "../../../components/form/EmployerProfile/EmployerProfile";
import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { useFormikContext } from "formik";
import { IPageDefinition } from "../../PageDefinitions";
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

const previousSegment = (currentSegment: string | undefined) => {
  const currentSegmentIdx = parseInt(currentSegment || "0");
  if (currentSegmentIdx - 1 < 0) {
    return false;
  } else {
    return currentSegmentIdx - 1 + "";
  }
};

export const EmployerInformation = (props: PageProps) => {
  const { t } = useTranslation("claimForm");
  const { values, setValues } = useFormikContext<ClaimantInput>();
  const segment = props.segment || "0";

  const removeEmployer = (idx: number) => {
    const employers = values.employers?.filter((_, i) => i !== idx);
    const LOCAL_more_employers = values.LOCAL_more_employers?.filter(
      (_, i) => i !== idx
    );
    setValues((form) => ({
      ...form,
      employers,
      LOCAL_more_employers,
    }));
  };

  return (
    <>
      {values.employers?.map((employer, idx) => (
        <div key={idx}>
          <span>{employer.name}</span>
          &nbsp;
          <Button
            type="button"
            className="usa-button--outline"
            onClick={() => removeEmployer(idx)}
          >
            X [{idx}]
          </Button>
        </div>
      ))}
      {/*TODO: Display only for first segment? ("TBD" in figma)*/}
      <Alert type="info">
        <Trans ns="claimForm" i18nKey="employers.reason_for_data_collection">
          {/*TODO: Just include english text as default here as the docs do?*/}
          employers.reason_for_data_collection
        </Trans>
      </Alert>
      <EmployerProfile segment={segment} />
      <Fieldset legend={t("employers.more_employers.label")}>
        <BooleanRadio
          id={`LOCAL_more_employers[${segment}]`}
          name={`LOCAL_more_employers[${segment}]`}
        />
      </Fieldset>
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
      .matches(/(^[0-9]{2}-[0-9]{7}$|)/),
    separation_comment: yup.string().max(1024),
  });

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    LOCAL_more_employers: yup
      .array()
      .of(yup.boolean().required(t("employers.more_employers.required"))),
    employers: yup.array().of(yupEmployer(t)),
  });

export const EmployerInformationPage: IPageDefinition = {
  path: "employer-information",
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
};
