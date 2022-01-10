import { FormGroup } from "@trussworks/react-uswds";
import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField/TextField";

export const EmailAddress = () => {
  const { t } = useTranslation("contact");

  return (
    <FormGroup>
      <TextField
        name="email_address"
        label={t("label.email_address")}
        type="text"
        id="email_address"
      />
      <TextField
        name="confirm_email_address"
        label={t("label.confirm_email_address")}
        type="text"
        id="confirm_email_address"
      />
    </FormGroup>
  );
};
