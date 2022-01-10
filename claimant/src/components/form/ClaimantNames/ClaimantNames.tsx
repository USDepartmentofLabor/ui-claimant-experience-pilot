import { Fieldset } from "@trussworks/react-uswds";
import { FieldArray, useFormikContext } from "formik";
import { ClaimSchemaField } from "../../../common/YupBuilder";

import { Name } from "../Name/Name";
import { YesNoRadio } from "../YesNoRadio/YesNoRadio";
import { useEffect } from "react";
import { PERSON_NAME_SKELETON } from "../../../utils/claim_form";

export const CLAIMANT_NAMES_SCHEMA_FIELDS: ClaimSchemaField[] = [
  "claimant_name",
  "LOCAL_claimant_has_alternate_names",
  "alternate_names",
];

export const ClaimantNames = () => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<Claim>();

  useEffect(() => {
    if (values.LOCAL_claimant_has_alternate_names === "no") {
      setFieldValue("alternate_names", []);
      setFieldTouched("alternate_names", false);
    }
  }, [values.LOCAL_claimant_has_alternate_names]);

  return (
    <>
      <Fieldset legend="Legal Name">
        <Name id="claimant_name" name="claimant_name" />
      </Fieldset>
      <br />
      <Fieldset legend="In the past 18 months, have you worked under a name different from above?">
        <YesNoRadio
          id="LOCAL_claimant_has_alternate_names"
          name="LOCAL_claimant_has_alternate_names"
        />
      </Fieldset>
      <br />
      {values.LOCAL_claimant_has_alternate_names === "yes" && (
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
