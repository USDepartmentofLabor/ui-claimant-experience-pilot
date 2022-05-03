import { BooleanRadio } from "../BooleanRadio/BooleanRadio";
import { Fieldset } from "@trussworks/react-uswds";
import { useShowErrors } from "../../../hooks/useShowErrors";
import { ChangeEventHandler, PropsWithChildren } from "react";

interface IYesNoQuestionProps {
  name: string;
  question: string;
  yesLabel?: string;
  noLabel?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const YesNoQuestion = ({
  question,
  children,
  ...inputProps
}: PropsWithChildren<IYesNoQuestionProps>) => {
  const showError = useShowErrors(inputProps.name);

  return (
    <Fieldset
      legend={question}
      className={
        showError ? "dol-fieldset usa-form-group--error" : "dol-fieldset"
      }
    >
      <BooleanRadio {...inputProps} />
      {children}
    </Fieldset>
  );
};
