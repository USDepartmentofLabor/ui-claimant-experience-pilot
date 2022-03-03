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
  const { values, setFieldValue, setValues } =
    useFormikContext<ClaimantInput>();
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

  useEffect(() => {
    setValues((v) => {
      const localPayTypes = values.LOCAL_pay_types || [];
      const otherPay = v.other_pay || [];
      const fixed = otherPay.filter((p) => localPayTypes.includes(p.pay_type));
      if (fixed.length === otherPay.length) return v;
      return { ...v, other_pay: fixed };
    });
  }, [values.LOCAL_pay_types]);

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
                  "aria-description":
                    option.value === "no_other_pay"
                      ? t(`pay_type.options.no_other_pay.ariaDescription`)
                      : undefined,
                  labelDescription: t(
                    `pay_type.options.${option.translationKey}.description`
                  ),
                  tile: true,
                  onChange: (e) => {
                    if (e.target.checked) {
                      if (e.target.value === "no_other_pay") {
                        setFieldValue(
                          "LOCAL_pay_types",
                          ["no_other_pay"],
                          true
                        );
                        setFieldValue(
                          "other_pay",
                          [{ pay_type: option.translationKey }],
                          true
                        );
                      } else {
                        arrayHelpers.push({ pay_type: option.translationKey });
                      }
                    }
                  },
                  disabled:
                    values?.LOCAL_pay_types?.includes("no_other_pay") &&
                    option.value != "no_other_pay",
                },
              }))}
            />
          </Fieldset>
          {!!values.other_pay &&
            sortPayDetails(values.other_pay, payTypeOrder).map(
              (otherPayDetail, index) =>
                otherPayDetail.pay_type !== "no_other_pay" && (
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
