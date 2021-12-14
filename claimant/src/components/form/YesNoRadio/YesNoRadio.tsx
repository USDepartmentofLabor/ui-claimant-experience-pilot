import { ChangeEventHandler } from "react";
import { useTranslation } from "react-i18next";

import { RadioField } from "../fields/RadioField/RadioField";

interface IYesNoRadioProps {
  id: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const YesNoRadio = ({
  id,
  name,
  onChange,
  ...inputProps
}: IYesNoRadioProps & JSX.IntrinsicElements["input"]) => {
  const { t } = useTranslation("common");
  return (
    <RadioField
      id={id}
      name={name}
      options={[
        { label: t("yes"), value: "yes" },
        { label: t("no"), value: "no" },
      ]}
      onChange={onChange}
      className="margin-right-7 display-inline-block"
      {...inputProps}
    />
  );
};
