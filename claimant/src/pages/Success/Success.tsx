import { useEffect } from "react";
import { Alert } from "@trussworks/react-uswds";
import { useQueryClient } from "react-query";
import { useWhoAmI } from "../../queries/whoami";
import { useTranslation } from "react-i18next";

interface ISuccessProps {
  justFinished?: boolean;
}

const Success = ({ justFinished }: ISuccessProps) => {
  const { data } = useWhoAmI();
  const { t } = useTranslation("home");
  const queryClient = useQueryClient();

  useEffect(() => {
    // Make sure our query reflects the claim being completed
    queryClient.invalidateQueries("getCompletedClaim");
  }, []);

  // If just finished the form
  if (justFinished) {
    return (
      <>
        <h1>{t("success.just_finished.title")}</h1>
        <Alert type="success">
          {t("success.just_finished.message", { claim_id: data?.claim_id })}
        </Alert>
      </>
    );
  }

  // If returning to app after having completed
  return (
    <>
      <h1>{t("success.returning.title")}</h1>
      <p>{t("success.returning.message", { claim_id: data?.claim_id })}</p>
    </>
  );
};

export default Success;
