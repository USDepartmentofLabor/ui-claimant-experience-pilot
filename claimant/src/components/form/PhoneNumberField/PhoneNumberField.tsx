import TextField from "../fields/TextField/TextField";
import { useTranslation } from "react-i18next";
import DropdownField from "../fields/DropdownField/DropdownField";
import CheckboxField from "../fields/CheckboxField/CheckboxField";

type PhoneNumberFieldProps = {
  id: string;
  name: string;
};

export const PhoneNumberField = ({ id, name }: PhoneNumberFieldProps) => {
  const { t } = useTranslation("common");

  return (
    <>
      <TextField
        id={`${id}.number`}
        name={`${name}.number`}
        label={t("phone.number")}
        type="text"
      />
      <DropdownField
        id={`${id}.type`}
        name={`${name}.type`}
        label={t("phone.type")}
        options={[
          { value: "mobile", label: t("phone.mobile") },
          { value: "home", label: t("phone.home") },
          { value: "work", label: t("phone.work") },
        ]}
      />
      <CheckboxField
        id={`${id}.sms`}
        name={`${name}.sms`}
        label={t("phone.sms")}
      />
    </>
  );
};
