import { BooleanRadio } from "../../../components/form/BooleanRadio/BooleanRadio";
import { Fieldset } from "@trussworks/react-uswds";
import TextAreaField from "../../../components/form/fields/TextAreaField/TextAreaField";
import { useFormikContext } from "formik";
import { IPageDefinition } from "../../PageDefinitions";
import { ClaimSchemaField } from "../../../common/YupBuilder";
import { useTranslation } from "react-i18next";
import { useClearFields } from "../../../hooks/useClearFields";

const schemaFields: ClaimSchemaField[] = ["availability"];

export const Availability = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "availability" });
  const { t: tCommon } = useTranslation("common");
  const { values } = useFormikContext<ClaimantInput>();

  useClearFields(
    values.availability?.can_begin_work_immediately,
    "availability.cannot_begin_work_immediately_reason"
  );

  useClearFields(
    values.availability?.can_work_full_time,
    "availability.cannot_work_full_time_reason"
  );

  useClearFields(
    !values.availability?.is_prevented_from_accepting_full_time_work,
    "availability.is_prevented_from_accepting_full_time_work_reason"
  );

  return (
    <>
      <h3>{t("heading")}</h3>
      <Fieldset legend={t("can_begin_work_immediately.label")}>
        <BooleanRadio
          id="availability.can_begin_work_immediately"
          name="availability.can_begin_work_immediately"
        />
        {values.availability?.can_begin_work_immediately === false && (
          <TextAreaField
            id="availability.cannot_begin_work_immediately_reason"
            name="availability.cannot_begin_work_immediately_reason"
            label={tCommon("provide_more_information")}
          />
        )}
      </Fieldset>
      <Fieldset legend={t("can_work_full_time.label")}>
        <BooleanRadio
          id="availability.can_work_full_time"
          name="availability.can_work_full_time"
        />
        {values.availability?.can_work_full_time === false && (
          <TextAreaField
            id="availability.cannot_work_full_time_reason"
            name="availability.cannot_work_full_time_reason"
            label={tCommon("provide_more_information")}
          />
        )}
      </Fieldset>
      <Fieldset legend={t("is_prevented_from_accepting_full_time_work.label")}>
        <BooleanRadio
          id="availability.is_prevented_from_accepting_full_time_work"
          name="availability.is_prevented_from_accepting_full_time_work"
        />
        {values.availability?.is_prevented_from_accepting_full_time_work && (
          <TextAreaField
            id="availability.is_prevented_from_accepting_full_time_work_reason"
            name="availability.is_prevented_from_accepting_full_time_work_reason"
            label={tCommon("provide_more_information")}
          />
        )}
      </Fieldset>
    </>
  );
};

export const AvailabilityPage: IPageDefinition = {
  path: "availability",
  heading: "availability",
  schemaFields: schemaFields,
  initialValues: {
    availability: {
      can_begin_work_immediately: undefined,
      can_work_full_time: undefined,
      is_prevented_from_accepting_full_time_work: undefined,
    },
  },
  Component: Availability,
};
