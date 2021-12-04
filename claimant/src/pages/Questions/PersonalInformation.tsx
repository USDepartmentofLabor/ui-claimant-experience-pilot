import { useTranslation } from "react-i18next";
import TextField from "../../components/form/fields/TextField";

export const PersonalInformation = () => {
  const { t } = useTranslation("home");

  return (
    <>
      <TextField
        name="claimant_name.first_name"
        label={t("label.first_name")}
        type="text"
        id="claimant_name.first_name"
      />
      <TextField
        name="claimant_name.last_name"
        label={t("label.last_name")}
        type="text"
        id="claimant_name.last_name"
      />
      <TextField
        name="email"
        label={t("label.email")}
        type="email"
        id="email"
      />
      <TextField
        name="birthdate"
        label={t("label.birthdate")}
        type="text"
        id="birthdate"
      />
      <TextField name="ssn" label={t("label.ssn")} type="text" id="ssn" />
    </>
  );
};
