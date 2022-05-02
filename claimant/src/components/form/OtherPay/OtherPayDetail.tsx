import { useTranslation } from "react-i18next";
import { FormGroup } from "@trussworks/react-uswds";

import TextAreaField from "../fields/TextAreaField/TextAreaField";
import { DateInputField } from "../fields/DateInputField/DateInputField";
import CurrencyField from "../fields/CurrencyField/CurrencyField";
import React from "react";

const OtherPayDetail = (props: {
  name: string;
  label: string;
  description?: string;
}) => {
  const { name, label, description = "" } = props;
  const { t } = useTranslation("claimForm");
  const lowerLabel = label.charAt(0).toLowerCase() + label.slice(1);

  return (
    <div
      data-testid={`payDetail-${name}`}
      className="margin-top-4 margin-bottom-4"
    >
      <h2 className="font-heading-sm">{label}</h2>
      <p className="font-body-xs">{description}</p>
      <FormGroup>
        <CurrencyField
          id={`${name}.total`}
          name={`${name}.total`}
          label={t("other_pay_detail.total.label", {
            payType: lowerLabel,
          })}
          inputPrefix={t("other_pay_detail.total.currencyPrefix")}
        />
        <DateInputField
          legend={t("other_pay_detail.date_received.label", {
            payType: lowerLabel,
          })}
          id={`${name}.date_received`}
          name={`${name}.date_received`}
        />
        <TextAreaField
          name={`${name}.note`}
          label={t("other_pay_detail.note.label", {
            payType: lowerLabel,
          })}
        />
      </FormGroup>
    </div>
  );
};

export default OtherPayDetail;
