import { Fieldset } from "@trussworks/react-uswds";
import { FieldArray, useFormikContext } from "formik";
import { Name } from "../Name/Name";
import { PERSON_NAME_SKELETON } from "../../../utils/claim_form";
import { useClearFields } from "../../../hooks/useClearFields";
import { BooleanRadio } from "../BooleanRadio/BooleanRadio";
import { useTranslation } from "react-i18next";
import { LiveMessage } from "react-aria-live";

export const ClaimantNames = () => {
  const { values } = useFormikContext<Claim>();
  const { t } = useTranslation("claimForm", { keyPrefix: "name" });
  const { t: commonT } = useTranslation("common");

  useClearFields(values.LOCAL_claimant_has_alternate_names === false, {
    fieldName: "alternate_names",
    value: [],
  });

  let liveMessageContent = "";
  if (values.LOCAL_claimant_has_alternate_names === true) {
    liveMessageContent = commonT("expanded_content.revealed");
  } else if (values.LOCAL_claimant_has_alternate_names === false) {
    liveMessageContent = commonT("expanded_content.collapsed");
  }

  return (
    <>
      <Fieldset legend={t("legal_name")}>
        <Name id="claimant_name" name="claimant_name" />
      </Fieldset>
      <br />
      <Fieldset legend={t("claimant_has_alternate_names.label")}>
        <BooleanRadio
          id="LOCAL_claimant_has_alternate_names"
          name="LOCAL_claimant_has_alternate_names"
        />
      </Fieldset>
      <LiveMessage aria-live="polite" message={liveMessageContent} />
      <br />
      {values.LOCAL_claimant_has_alternate_names === true && (
        <Fieldset legend={t("alternate_name")} id="alternate_names_fieldset">
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
