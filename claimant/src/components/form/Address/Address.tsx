import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField";
import DropdownField from "../fields/DropdownField/DropdownField";
import states from "../../../schemas/states.json";
import { FormGroup } from "@trussworks/react-uswds";

type StateAbbrev = keyof typeof states;

interface IAddressProps {
  basename: string;
  stateSlice?: StateAbbrev[];
}

interface IStates {
  [key: string]: string;
}

const statesByAbbrev: IStates = states;
const stateOptions: StateType[] = Object.keys(statesByAbbrev).map((abbrev) => {
  return { value: abbrev, label: statesByAbbrev[abbrev] };
});

export const Address = ({
  basename,
  stateSlice = undefined,
}: IAddressProps) => {
  const { t } = useTranslation("common"); // TODO make this a prop name

  let stateDropdownOptions: StateType[] = stateOptions;
  if (stateSlice) {
    stateDropdownOptions = stateOptions.filter(
      (opt) => !stateSlice.includes(opt.value as StateAbbrev)
    );
  }
  stateDropdownOptions.unshift({ value: "", label: t("label.select_one") });

  return (
    <FormGroup>
      <TextField
        name={`${basename}.address1`}
        label={t("label.address1")}
        type="text"
        id={`${basename}.address1`}
      />
      <TextField
        name={`${basename}.address2`}
        label={t("label.address2")}
        type="text"
        id={`${basename}.address2`}
      />
      <TextField
        name={`${basename}.city`}
        label={t("label.city")}
        type="text"
        id={`${basename}.city`}
      />
      <DropdownField
        name={`${basename}.state`}
        label={t("label.state")}
        id={`${basename}.state`}
        options={stateDropdownOptions}
      />
      <TextField
        // TODO pass medium
        name={`${basename}.zipcode`}
        label={t("label.zipcode")}
        type="text"
        id={`${basename}.zipcode`}
        // TODO pattern="[\d]{5}(-[\d]{4})?"
      />
    </FormGroup>
  );
};

export default Address;
