import { DetailedHTMLProps, HTMLAttributes, RefObject } from "react";
import { useTranslation } from "react-i18next";

import styles from "./ClaimFormHeading.module.scss";

type ClaimFormHeadingProps = {
  pageHeading: string;
  step: number;
  totalSteps: number;
  headingRef?: RefObject<HTMLHeadingElement>;
};

export const ClaimFormPageHeading = ({
  pageHeading,
  step,
  totalSteps,
  headingRef,
}: ClaimFormHeadingProps &
  DetailedHTMLProps<
    HTMLAttributes<HTMLHeadingElement>,
    HTMLHeadingElement
  >) => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <h1
        tabIndex={-1}
        ref={headingRef}
        className={styles.pageHeading}
        aria-label={`${pageHeading} ${t("step_progress", {
          step,
          totalSteps,
        })}`}
      >
        {pageHeading}
      </h1>
    </>
  );
};
