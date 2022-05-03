import TextField from "../fields/TextField/TextField";
import { Trans, useTranslation } from "react-i18next";
import DropdownField from "../fields/DropdownField/DropdownField";
import CheckboxField from "../fields/CheckboxField/CheckboxField";

type PhoneNumberFieldProps = {
  id?: string;
  name: string;
  showSMS?: boolean;
};

export const PhoneNumberField = ({
  name,
  showSMS = true,
}: PhoneNumberFieldProps) => {
  const { t } = useTranslation("common");

  return (
    <>
      <TextField
        name={`${name}.number`}
        label={t("phone.number.label")}
        type="tel"
      />
      <DropdownField
        name={`${name}.type`}
        label={
          <Trans t={t} i18nKey="phone.type.label">
            Type of phone number <i>(optional)</i>
          </Trans>
        }
        startEmpty
        options={[
          { value: "mobile", label: t("phone.mobile") },
          { value: "home", label: t("phone.home") },
          { value: "work", label: t("phone.work") },
        ]}
      />
      {showSMS && (
        <CheckboxField name={`${name}.sms`} label={t("phone.sms.label")} />
      )}
    </>
  );
};
