import { DetailedHTMLProps, HTMLAttributes } from "react";
import { useTranslation } from "react-i18next";

type ClaimFormHeadingProps = {
  pageHeading: string;
  step: number;
  totalSteps: number;
};

export const ClaimFormPageHeading = ({
  pageHeading,
  step,
  totalSteps,
}: ClaimFormHeadingProps &
  DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >) => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <h1>{pageHeading} </h1>
      <span className="usa-sr-only">
        {t("step_progress", { step, totalSteps })}
      </span>
    </>
  );
};
