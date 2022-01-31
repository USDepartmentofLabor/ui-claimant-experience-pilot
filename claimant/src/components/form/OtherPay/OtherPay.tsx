import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Fieldset } from "@trussworks/react-uswds";

import { CheckboxGroupField } from "../fields/CheckboxGroupField/CheckboxGroupField";
import claimForm from "../../../i18n/en/claimForm";
import OtherPayDetail from "./OtherPayDetail";
import { useFormikContext, FieldArray } from "formik";

type PayTypeOption = {
  value: string;
  translationKey: keyof typeof claimForm.other_pay_detail.pay_type.options;
};

export const payTypeOptions: PayTypeOption[] = Object.keys(
  claimForm.other_pay_detail.pay_type.options
).map((option) => ({
  value: option,
  translationKey: option as PayTypeOption["translationKey"],
}));

const OtherPay = () => {
  const { t } = useTranslation("claimForm", { keyPrefix: "other_pay_detail" });
  const { values, setFieldValue } = useFormikContext<ClaimantInput>();
  const payTypeOrder = payTypeOptions.map((opt) => opt.value);
  const sortPayDetails = (
    otherPayArray: ClaimantInput["other_pay"],
    order: string[]
  ) => {
    const otherPay = [...(otherPayArray || [])];
    otherPay.sort(function (a, b) {
      const A = a.pay_type;
      const B = b.pay_type;

      if (order.indexOf(A) > order.indexOf(B)) {
        return 1;
      } else {
        return -1;
      }
    });

    return otherPay;
  };
  useEffect(() => {
    const otherPay = values.other_pay || [];
    if (otherPay.length > 0) {
      const pay_types = otherPay.map((detail) => detail.pay_type);
      setFieldValue("LOCAL_pay_types", pay_types);
    } else {
      setFieldValue("LOCAL_pay_types", []);
    }
  }, [values.other_pay]);

  return (
    <FieldArray
      name="other_pay"
      render={(arrayHelpers) => (
        <>
          <Fieldset legend={t("pay_type.label")}>
            <CheckboxGroupField
              id="LOCAL_pay_types"
              name="LOCAL_pay_types"
              options={payTypeOptions.map((option) => ({
                label: t(`pay_type.options.${option.translationKey}.label`),
                value: option.value,
                checkboxProps: {
                  labelDescription: t(
                    `pay_type.options.${option.translationKey}.description`
                  ),
                  tile: true,
                  onChange: (e) => {
                    if (e.target.checked) {
                      arrayHelpers.push({ pay_type: option.translationKey });
                    } else {
                      values?.other_pay &&
                        arrayHelpers.remove(
                          values.other_pay.findIndex(
                            (item) => item.pay_type === option.translationKey
                          )
                        );
                    }
                  },
                },
              }))}
            />
          </Fieldset>
          {!!values.other_pay &&
            sortPayDetails(values.other_pay, payTypeOrder).map(
              (otherPayDetail, index) => (
                <OtherPayDetail
                  key={`other_pay.${index}`}
                  name={`other_pay.${index}`}
                  label={t(
                    `pay_type.options.${
                      otherPayDetail.pay_type as PayTypeOption["translationKey"]
                    }.label`
                  )}
                  description={t(
                    `pay_type.options.${
                      otherPayDetail.pay_type as PayTypeOption["translationKey"]
                    }.description`
                  )}
                />
              )
            )}
        </>
      )}
    />
  );
};

export default OtherPay;
