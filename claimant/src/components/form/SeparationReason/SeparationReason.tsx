import { useMemo } from "react";
import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
import { Trans, useTranslation } from "react-i18next";
import claimForm from "../../../i18n/en/claimForm";
import { TextAreaField } from "../fields/TextAreaField/TextAreaField";
import { RadioField } from "../fields/RadioField/RadioField";

interface ISeparationReasonProps {
  segment: string;
}

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
  options?: SeparationOption[];
  comment_required: boolean;
};

export const separationReasons = new Map<
  SeparationReasonOptionType,
  SeparationReasonType
>([
  [
    "laid_off",
    {
      options: Object.keys(
        claimForm.employers.separation.reasons.laid_off.options
      ) as LaidOffOption[],
      comment_required: false,
    },
  ],
  [
    "fired_discharged_terminated",
    {
      options: Object.keys(
        claimForm.employers.separation.reasons.fired_discharged_terminated
          .options
      ) as FiredOption[],
      comment_required: true,
    },
  ],
  [
    "still_employed",
    {
      options: Object.keys(
        claimForm.employers.separation.reasons.still_employed.options
      ) as StillEmployedOption[],
      comment_required: true,
    },
  ],
  [
    "quit",
    {
      options: Object.keys(
        claimForm.employers.separation.reasons.quit.options
      ) as QuitOption[],
      comment_required: true,
    },
  ],
  [
    "strike",
    {
      comment_required: true,
    },
  ],
  [
    "retired",
    {
      comment_required: true,
    },
  ],
  [
    "shutdown",
    {
      comment_required: true,
    },
  ],
]);

const SeparationReasonLabel = (props: {
  reason: SeparationReasonOptionType;
}) => {
  const { t } = useTranslation("claimForm", {
    keyPrefix: "employers.separation.reasons",
  });
  return (
    <>
      <span>{t(`${props.reason}.label`)}</span>
      <div className="usa-checkbox__label-description">
        {t(`${props.reason}.description`)}
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
      employer.separation_reason
        ? separationReasons.get(employer.separation_reason)
        : null,
    [employer.separation_reason]
  );

  const labelForReasonOption = (option: SeparationOption) => {
    const reasonKey = employer.separation_reason;
    const optionKey = String(option as keyof SeparationOption);
    return `separation.reasons.${reasonKey}.options.${optionKey}`;
  };

  return (
    <>
      <h2 className="font-heading-md">{t("separation.heading")}</h2>
      <Fieldset legend={t("separation.reason.label")}>
        <RadioField
          tile
          id={`employers[${segmentIdx}].separation_reason`}
          name={`employers[${segmentIdx}].separation_reason`}
          options={Array.from(separationReasons.keys()).map((reason) => {
            return {
              label: <SeparationReasonLabel reason={reason} />,
              value: reason,
            };
          })}
        />
      </Fieldset>
      {employer.separation_reason && selectedReason?.options && (
        <Fieldset
          legend={t(
            `separation.reasons.${employer.separation_reason}.option_heading`
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
