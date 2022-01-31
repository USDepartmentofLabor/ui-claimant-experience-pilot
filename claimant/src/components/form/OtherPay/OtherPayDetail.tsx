import { useTranslation } from "react-i18next";
import { Fieldset, FormGroup } from "@trussworks/react-uswds";

import TextAreaField from "../fields/TextAreaField/TextAreaField";
import TextField from "../fields/TextField/TextField";
import { DateInputField } from "../fields/DateInputField/DateInputField";
import React from "react";

const OtherPayDetail = (props: {
  name: string;
  label: string;
  description?: string;
}) => {
  const { name, label, description = "" } = props;
  const { t } = useTranslation("claimForm");

  return (
    <div
      data-testid={`payDetail-${name}`}
      className="margin-top-4 margin-bottom-4"
    >
      <h2 className="font-heading-sm">{label}</h2>
      <p className="font-body-xs">{description}</p>
      <FormGroup>
        <TextField
          id={`${name}.total`}
          name={`${name}.total`}
          label={t("other_pay_detail.total.label", {
            payType: label,
          })}
          inputPrefix="$"
          type="number"
          min="0"
          step=".01"
        />
        <Fieldset
          legend={t("other_pay_detail.date_received.label", {
            payType: label,
          })}
        >
          <DateInputField
            id={`${name}.date_received`}
            name={`${name}.date_received`}
          />
        </Fieldset>
        <TextAreaField
          id={`${name}.note`}
          name={`${name}.note`}
          label={t("other_pay_detail.note.label", {
            payType: label,
          })}
        />
      </FormGroup>
    </div>
  );
};

export default OtherPayDetail;
