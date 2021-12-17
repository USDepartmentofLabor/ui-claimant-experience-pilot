import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField/TextField";
import DropdownField from "../fields/DropdownField/DropdownField";
import states from "../../../schemas/states.json";
import { FormGroup } from "@trussworks/react-uswds";

type StateAbbrev = keyof typeof states;

interface IAddressLabels {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipcode: string;
}

interface IAddressProps {
  labels?: IAddressLabels;
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

export const Address = ({ labels, basename, stateSlice }: IAddressProps) => {
  const { t } = useTranslation("common");
  const defaultLabels: IAddressLabels = {
    address1: t("address.address1.label"),
    address2: t("address.address2.label"),
    city: t("address.city.label"),
    state: t("address.state.label"),
    zipcode: t("address.zipcode.label"),
  };

  let stateDropdownOptions: StateType[] = stateOptions;
  if (stateSlice) {
    stateDropdownOptions = stateOptions.filter(
      (opt) => !stateSlice.includes(opt.value as StateAbbrev)
    );
  }
  stateDropdownOptions.unshift({ value: "", label: t("select_one") });

  return (
    <FormGroup>
      <TextField
        name={`${basename}.address1`}
        label={labels ? labels.address1 : defaultLabels.address1}
        type="text"
        id={`${basename}.address1`}
      />
      <TextField
        name={`${basename}.address2`}
        label={labels ? labels.address2 : defaultLabels.address2}
        type="text"
        id={`${basename}.address2`}
      />
      <TextField
        name={`${basename}.city`}
        label={labels ? labels.city : defaultLabels.city}
        type="text"
        id={`${basename}.city`}
      />
      <DropdownField
        name={`${basename}.state`}
        label={labels ? labels.state : defaultLabels.state}
        id={`${basename}.state`}
        options={stateDropdownOptions}
      />
      <TextField
        // TODO pass medium
        name={`${basename}.zipcode`}
        label={labels ? labels.zipcode : defaultLabels.zipcode}
        type="text"
        id={`${basename}.zipcode`}
        // TODO pattern="[\d]{5}(-[\d]{4})?"
      />
    </FormGroup>
  );
};

export default Address;
