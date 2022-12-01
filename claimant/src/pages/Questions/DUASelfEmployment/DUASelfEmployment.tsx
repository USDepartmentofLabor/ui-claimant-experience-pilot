// import { Fieldset } from "@trussworks/react-uswds";
import { useFormikContext } from "formik";
// import TextField from "../../../components/form/fields/TextField/TextField";
import { IPageDefinition } from "../../PageDefinitions";
// import { useClearFields } from "../../../hooks/useClearFields";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
// import HelpText from "../../../components/HelpText/HelpText";
import * as yup from "yup";
import { DateInputField } from "../../../components/form/fields/DateInputField/DateInputField";
import TextAreaField from "../../../components/form/fields/TextAreaField/TextAreaField";

export const DUASelfEmployment = () => {
  const {
    values: { dua_self_employment },
  } = useFormikContext<ClaimantInput>();

  const data: ClaimantInput["dua_self_employment"] = dua_self_employment || {};

  return (
    <>
      <>
        <YesNoQuestion
          question={"At the time of the Disaster, were you self-employed?"}
          name="dua_self_employment.was_self_employed"
        />
        {data.was_self_employed === false && (
          <YesNoQuestion
            question={
              "Were you scheduled to begin self-employment work in the near future?"
            }
            name="dua_self_employment.scheduled_to_start_in_future"
          />
        )}
        {data.scheduled_to_start_in_future && (
          <>
            <DateInputField
              legend={
                "When did you anticipate beginning self-employment work, if not for the disaster?"
              }
              name="dua_self_employment.date_scheduled_to_start_in_future"
            />
            <TextAreaField
              name="dua_self_employment.reason_scheduled_to_start_in_future"
              label="Why were you unable to begin on that date? "
            />
            <TextAreaField
              name="dua_self_employment.steps_taken_prior_to_disaster"
              label="What steps have you taken to begin self-employment prior to the Disaster?"
            />
          </>
        )}
      </>
    </>
  );
};

const pageSchema = () => yup.object();

export const DUASelfEmploymentPage: IPageDefinition = {
  path: "self-employment",
  heading: "dua_self_employment",
  initialValues: {},
  Component: DUASelfEmployment,
  pageSchema,
};
