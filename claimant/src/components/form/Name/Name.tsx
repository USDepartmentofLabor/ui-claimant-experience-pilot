import TextField from "../fields/TextField/TextField";
import { Trans, useTranslation } from "react-i18next";

interface INameProps {
  id: string;
  name: string;
}

export const Name = ({ id, name }: INameProps) => {
  const { t } = useTranslation("claimForm");

  return (
    <>
      <TextField
        id={`${id}.first_name`}
        name={`${name}.first_name`}
        label={t("name.first_name.label")}
        type="text"
      />
      <TextField
        id={`${id}.middle_name`}
        name={`${name}.middle_name`}
        label={
          <Trans t={t} i18nKey="name.middle_name.label">
            Middle name <i>(optional)</i>
          </Trans>
        }
        type="text"
      />
      <TextField
        id={`${id}.last_name`}
        name={`${name}.last_name`}
        label={t("name.last_name.label")}
        type="text"
      />
    </>
  );
};
