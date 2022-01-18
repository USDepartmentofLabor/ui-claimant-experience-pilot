import { useMemo } from "react";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { Normalize, Trans, useTranslation } from "react-i18next";
import claimForm from "../../../i18n/en/claimForm";
import { TextAreaField } from "../fields/TextAreaField/TextAreaField";
import { RadioField } from "../fields/RadioField/RadioField";

interface ISeparationReasonProps {
  segment: string;
}

type Reason = keyof typeof claimForm.employers.separation.reasons;
type LaidOffOption =
  keyof typeof claimForm.employers.separation.reasons.laid_off.options;
type FiredOption =
  keyof typeof claimForm.employers.separation.reasons.fired_discharged_terminated.options;
type StillEmployedOption =
  keyof typeof claimForm.employers.separation.reasons.still_employed.options;
type QuitOption =
  keyof typeof claimForm.employers.separation.reasons.quit.options;

type SeparationOption =
  | LaidOffOption
  | FiredOption
  | StillEmployedOption
  | QuitOption;

type SeparationReasonType = {
  reason: Normalize<Reason>;
  options?: SeparationOption[];
  comment_required: boolean;
};

const separationReasons: SeparationReasonType[] = [
  {
    reason: "laid_off" as Normalize<Reason>,
    options: Object.keys(
      claimForm.employers.separation.reasons.laid_off.options
    ) as LaidOffOption[],
    comment_required: false,
  },
  {
    reason: "fired_discharged_terminated" as Normalize<Reason>,
    options: Object.keys(
      claimForm.employers.separation.reasons.fired_discharged_terminated.options
    ) as FiredOption[],
    comment_required: true,
  },
  {
    reason: "still_employed" as Normalize<Reason>,
    options: Object.keys(
      claimForm.employers.separation.reasons.still_employed.options
    ) as StillEmployedOption[],
    comment_required: true,
  },
  {
    reason: "quit" as Normalize<Reason>,
    options: Object.keys(
      claimForm.employers.separation.reasons.quit.options
    ) as QuitOption[],
    comment_required: true,
  },
  {
    reason: "strike" as Normalize<Reason>,
    comment_required: true,
  },
  {
    reason: "retired" as Normalize<Reason>,
    comment_required: true,
  },
  {
    reason: "shutdown" as Normalize<Reason>,
    comment_required: true,
  },
];

const SeparationReasonLabel = (props: {
  separationReason: SeparationReasonType;
}) => {
  const { t } = useTranslation("claimForm", {
    keyPrefix: "employers.separation.reasons",
  });
  const transKey = props.separationReason.reason as Reason;
  return (
    <>
      <span>{t(`${transKey}.label`)}</span>
      <div className="usa-checkbox__label-description">
        {t(`${transKey}.description`)}
      </div>
    </>
  );
};

export const SeparationReason = ({ segment }: ISeparationReasonProps) => {
  const { t } = useTranslation("claimForm", { keyPrefix: "employers" });
  const { values } = useFormikContext<ClaimantInput>();

  const segmentIdx = parseInt(segment);
  const segmentExists = !!values.employers?.[segmentIdx];

  if (!values.employers || !segmentExists) {
    return null;
  }
  const employer = values.employers[segmentIdx];

  const selectedReason = useMemo(
    () =>
      separationReasons.find((r) => r.reason === employer.separation_reason),
    [employer.separation_reason]
  );

  const labelForReasonOption = (option: SeparationOption) => {
    const reasonKey = employer.separation_reason as Reason;
    const optionKey = String(option as keyof SeparationOption);
    return `separation.reasons.${reasonKey}.options.${optionKey}`;
  };

  return (
    <>
      <h3>{t("separation.heading")}</h3>
      <Fieldset legend={t("separation.reason.label")}>
        <RadioField
          tile
          id={`employers[${segmentIdx}].separation_reason`}
          name={`employers[${segmentIdx}].separation_reason`}
          options={separationReasons.map((sr) => {
            return {
              label: <SeparationReasonLabel separationReason={sr} />,
              value: sr.reason as string,
            };
          })}
        />
      </Fieldset>
      {employer.separation_reason && selectedReason?.options && (
        <Fieldset
          legend={t(
            `separation.reasons.${
              employer.separation_reason as Reason
            }.option_heading`
          )}
        >
          <RadioField
            id={`employers[${segmentIdx}].separation_option`}
            name={`employers[${segmentIdx}].separation_option`}
            options={(selectedReason?.options || []).map((option) => {
              return {
                label: <Trans t={t}>{labelForReasonOption(option)}</Trans>,
                value: option,
              };
            })}
          />
        </Fieldset>
      )}
      <TextAreaField
        name={`employers[${segmentIdx}].separation_comment`}
        id={`employers[${segmentIdx}].separation_comment`}
        label={t(
          selectedReason?.comment_required
            ? "separation.comment.required_label"
            : "separation.comment.optional_label"
        )}
      />
    </>
  );
};
