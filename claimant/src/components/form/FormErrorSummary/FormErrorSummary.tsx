import { Alert } from "@trussworks/react-uswds";
import { FormikErrors } from "formik";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface IFormErrorSummary {
  errors: FormikErrors<Claim>;
}

export const FormErrorSummary = ({ errors }: IFormErrorSummary) => {
  const { t } = useTranslation("claimForm");
  const count = useMemo(() => countErrors(errors), [errors]) || 0;

  return (
    <Alert role="alert" type="error" slim>
      {t("validation_alert", { count })}
    </Alert>
  );
};

const countErrors = (errors: FormikErrors<Claim>) => {
  let totalErrors = 0;
  const objects: Record<string, any>[] = [errors];
  while (objects.length) {
    const cur = objects.pop();
    if (!cur) {
      continue;
    }
    Object.values(cur).forEach((val) => {
      if (typeof val === "string") {
        totalErrors++;
      } else if (typeof val === "object") {
        objects.push(val);
      }
    });
  }
  return totalErrors;
};
