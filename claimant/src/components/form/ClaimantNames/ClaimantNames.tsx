import { Fieldset } from "@trussworks/react-uswds";
import { FieldArray, useFormikContext } from "formik";
import { Name } from "../Name/Name";
import { PERSON_NAME_SKELETON } from "../../../utils/claim_form";
import { useClearFields } from "../../../hooks/useClearFields";
import { BooleanRadio } from "../BooleanRadio/BooleanRadio";

export const ClaimantNames = () => {
  const { values } = useFormikContext<Claim>();

  useClearFields(values.LOCAL_claimant_has_alternate_names === false, {
    fieldName: "alternate_names",
    value: [],
  });

  return (
    <>
      <Fieldset legend="Legal Name">
        <Name id="claimant_name" name="claimant_name" />
      </Fieldset>
      <br />
      <Fieldset legend="In the past 18 months, have you worked under a name different from above?">
        <BooleanRadio
          id="LOCAL_claimant_has_alternate_names"
          name="LOCAL_claimant_has_alternate_names"
        />
      </Fieldset>
      <br />
      {values.LOCAL_claimant_has_alternate_names === true && (
        <Fieldset legend="Alternate Name">
          <FieldArray
            name="alternate_names"
            render={() => {
              values.alternate_names?.length === 0 &&
                values.alternate_names.push({ ...PERSON_NAME_SKELETON });
              return values.alternate_names?.map((alternateName, index) => {
                const name = `alternate_names.${index}`;
                return <Name key={name} id={name} name={name} />;
              });
            }}
          />
        </Fieldset>
      )}
    </>
  );
};
