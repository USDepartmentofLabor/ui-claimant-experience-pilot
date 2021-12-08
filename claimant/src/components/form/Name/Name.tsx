import TextField from "../fields/TextField";
import { useTranslation } from "react-i18next";

interface INameProps {
  id: string;
  name: string;
}

export const Name = ({ id, name }: INameProps) => {
  const { t } = useTranslation("home");

  return (
    <>
      <TextField
        id={`${id}.first_name`}
        name={`${name}.first_name`}
        label={t("label.first_name")}
        type="text"
      />
      <TextField
        id={`${id}.middle_name`}
        name={`${name}.middle_name`}
        label={t("label.middle_name")}
        type="text"
      />
      <TextField
        id={`${id}.last_name`}
        name={`${name}.last_name`}
        label={t("label.last_name")}
        type="text"
      />
    </>
  );
};
