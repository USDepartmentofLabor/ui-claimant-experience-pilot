import { useTranslation } from "react-i18next";
import TextField from "../fields/TextField";
import DropdownField from "../fields/DropdownField/DropdownField";
// import FieldGroup from "../FieldGroup/FieldGroup";

type StateType = {
  id: string;
  label: string;
};

interface IAddressProps {
  basename: string;
  states: StateType[];
}

export const Address = ({ basename, states }: IAddressProps) => {
  const { t } = useTranslation("home"); // TODO

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
          options={states}
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
