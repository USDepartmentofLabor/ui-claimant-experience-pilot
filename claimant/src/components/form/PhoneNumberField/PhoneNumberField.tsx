import TextField from "../fields/TextField/TextField";
import { Trans, useTranslation } from "react-i18next";
import DropdownField from "../fields/DropdownField/DropdownField";
import CheckboxField from "../fields/CheckboxField/CheckboxField";

type PhoneNumberFieldProps = {
  id: string;
  name: string;
  showSMS?: boolean;
};

export const PhoneNumberField = ({
  id,
  name,
  showSMS = true,
}: PhoneNumberFieldProps) => {
  const { t } = useTranslation("common");

  return (
    <>
      <TextField
        id={`${id}.number`}
        name={`${name}.number`}
        label={t("phone.number.label")}
        type="tel"
      />
      <DropdownField
        id={`${id}.type`}
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
        <CheckboxField
          id={`${id}.sms`}
          name={`${name}.sms`}
          label={t("phone.sms.label")}
        />
      )}
    </>
  );
};
