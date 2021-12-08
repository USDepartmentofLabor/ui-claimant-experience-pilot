import { Fieldset } from "@trussworks/react-uswds";
import { Name } from "../Name/Name";
import { FieldArray } from "formik";

export const ClaimantNames = () => {
  return (
    <>
      <Fieldset legend="Name" legendStyle="large">
        <Name id="claimant_name" name="claimant_name" />
      </Fieldset>
      <br />
      <Fieldset legend="Other Name" legendStyle="large">
        <FieldArray
          name={"alternate_names"}
          render={() => {
            const index = 0;
            const name = `alternate_names.${index}`;
            return <Name key={name} id={name} name={name} />;
          }}
        />
      </Fieldset>
    </>
  );
};
