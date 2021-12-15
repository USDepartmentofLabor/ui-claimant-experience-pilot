import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField";
import DropdownField from "../fields/DropdownField/DropdownField";
import states from "../../../schemas/states.json";

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
  return { id: abbrev, label: statesByAbbrev[abbrev] };
});
stateOptions.unshift({ id: "", label: "-- Select one --" });

export const Address = ({
  basename,
  stateSlice = undefined,
}: IAddressProps) => {
  const { t } = useTranslation("home"); // TODO

  let stateDropdownOptions: StateType[] = stateOptions;
  if (stateSlice) {
    stateDropdownOptions = stateOptions.filter(
      (opt) => !stateSlice.includes(opt.id as StateAbbrev)
    );
  }

  return (
    <>
      <div className="usa-form-group">
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
      </div>
    </>
  );
};

export default Address;
