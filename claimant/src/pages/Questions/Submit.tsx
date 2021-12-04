import { Button, FormGroup } from "@trussworks/react-uswds";
import { useTranslation } from "react-i18next";
import CheckboxField from "../../components/form/fields/CheckboxField";
import { useSubmitClaim } from "../../queries/claim";

type Props = {
  submitClaim: ReturnType<typeof useSubmitClaim>;
};

export const Submit = ({ submitClaim }: Props) => {
  const { t } = useTranslation("home");

  return (
    <>
      <CheckboxField
        id="is_complete"
        name="is_complete"
        label={t("label.is_complete")}
        labelDescription={t("label.is_complete_description")}
        tile
      />
      <FormGroup>
        <Button
          type="submit"
          disabled={
            submitClaim.isLoading ||
            (submitClaim.isSuccess && submitClaim.data.status === 201)
          }
        >
          {t("sampleForm.claimButton")}
        </Button>
      </FormGroup>
    </>
  );
};
