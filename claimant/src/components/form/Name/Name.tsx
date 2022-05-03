import TextField from "../fields/TextField/TextField";
import { Trans, useTranslation } from "react-i18next";

interface INameProps {
  name: string;
}

export const Name = ({ name }: INameProps) => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <TextField
        name={`${name}.first_name`}
        label={t("name.first_name.label")}
        type="text"
      />
      <TextField
        name={`${name}.middle_name`}
        label={
          <Trans t={t} i18nKey="name.middle_name.label">
            Middle name <i>(optional)</i>
          </Trans>
        }
        type="text"
      />
      <TextField
        name={`${name}.last_name`}
        label={t("name.last_name.label")}
        type="text"
      />
    </>
  );
};
