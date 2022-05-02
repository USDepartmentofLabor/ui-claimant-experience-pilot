import { useEffect } from "react";
import { Normalize, TFunction, useTranslation } from "react-i18next";
import { Fieldset } from "@trussworks/react-uswds";
import * as yup from "yup";

import { RadioField } from "../../../components/form/fields/RadioField/RadioField";
import { TextField } from "../../../components/form/fields/TextField/TextField";
import claimForm from "../../../i18n/en/claimForm";
import { IPageDefinition } from "../../PageDefinitions";
import { useFormikContext } from "formik";
import { YesNoQuestion } from "../../../components/form/YesNoQuestion/YesNoQuestion";
import HelpText from "../../../components/HelpText/HelpText";

type PaymentMethodOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.payment.payment_method.options>;
};

const paymentMethodOptions: PaymentMethodOption[] = Object.keys(
  claimForm.payment.payment_method.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<
    typeof claimForm.payment.payment_method.options
  >,
}));

type AccountTypeOption = {
  value: string;
  translationKey: Normalize<typeof claimForm.payment.account_type.options>;
};

const accountTypeOptions: AccountTypeOption[] = Object.keys(
  claimForm.payment.account_type.options
).map((option) => ({
  value: option,
  translationKey: option as Normalize<
    typeof claimForm.payment.account_type.options
  >,
}));

export const PaymentInformation = () => {
  const { values, setFieldValue, setFieldTouched } =
    useFormikContext<ClaimantInput>();
  const showDepositFields = values.payment?.payment_method === "direct_deposit";
  const { t } = useTranslation("claimForm", {
    keyPrefix: "payment",
  });

  useEffect(() => {
    if (values.payment?.payment_method === "debit") {
      const accountFields = [
        "account_type",
        "routing_number",
        "LOCAL_re_enter_routing_number",
        "account_number",
        "LOCAL_re_enter_account_number",
      ];

      accountFields.forEach((field) => {
        setFieldValue(`payment.${field}`, undefined);
        setFieldTouched(`payment.${field}`, false);
      });
    }
  }, [values.payment?.payment_method]);

  return (
    <>
      <YesNoQuestion
        question={t("federal_income_tax_withheld.label")}
        id="federal_income_tax_withheld"
        name="federal_income_tax_withheld"
      >
        <HelpText withLeftBorder={true}>
          {t("federal_income_tax_withheld.help_text")}
        </HelpText>
      </YesNoQuestion>
      <Fieldset legend={t("payment_method.label")}>
        <RadioField
          name="payment.payment_method"
          options={paymentMethodOptions.map((option) => {
            return {
              label: t(`payment_method.options.${option.translationKey}`),
              value: option.value,
            };
          })}
        />
      </Fieldset>
      {showDepositFields && (
        <>
          <Fieldset legend={t("account_type.label")}>
            <RadioField
              name="payment.account_type"
              options={accountTypeOptions.map((option) => {
                return {
                  label: t(`account_type.options.${option.translationKey}`),
                  value: option.value,
                };
              })}
            />
          </Fieldset>
          <TextField
            label={t("routing_number.label")}
            name="payment.routing_number"
            type="text"
          />
          <TextField
            label={t("re_enter_routing_number.label")}
            name="payment.LOCAL_re_enter_routing_number"
            type="text"
          />
          <TextField
            label={t("account_number.label")}
            name="payment.account_number"
            type="text"
          />
          <TextField
            label={t("re_enter_account_number.label")}
            name="payment.LOCAL_re_enter_account_number"
            type="text"
          />
        </>
      )}
    </>
  );
};

const pageSchema = (t: TFunction<"claimForm">) =>
  yup.object().shape({
    federal_income_tax_withheld: yup
      .mixed()
      .oneOf([true, false])
      .required(t("payment.federal_income_tax_withheld.errors.required")),
    payment: yup.object().shape({
      payment_method: yup
        .mixed()
        .oneOf(paymentMethodOptions.map(({ value }) => value))
        .required(t("payment.payment_method.errors.required")),
      account_type: yup
        .mixed()
        .oneOf(accountTypeOptions.map(({ value }) => value))
        .when("payment_method", {
          is: "direct_deposit",
          then: yup.mixed().required(t("payment.account_type.errors.required")),
        }),
      routing_number: yup.mixed().when("payment_method", {
        is: "direct_deposit",
        then: yup.mixed().required(t("payment.routing_number.errors.required")),
      }),
      LOCAL_re_enter_routing_number: yup.mixed().when("payment_method", {
        is: "direct_deposit",
        then: yup
          .mixed()
          .oneOf(
            [yup.ref("routing_number"), null],
            t("payment.re_enter_routing_number.errors.mustMatch")
          )
          .required(t("payment.re_enter_routing_number.errors.required")),
      }),
      account_number: yup.mixed().when("payment_method", {
        is: "direct_deposit",
        then: yup.mixed().required(t("payment.account_number.errors.required")),
      }),
      LOCAL_re_enter_account_number: yup.mixed().when("payment_method", {
        is: "direct_deposit",
        then: yup
          .mixed()
          .oneOf(
            [yup.ref("account_number"), null],
            t("payment.re_enter_account_number.errors.mustMatch")
          )
          .required(t("payment.re_enter_account_number.errors.required")),
      }),
    }),
  });

export const PaymentInformationPage: IPageDefinition = {
  path: "payment",
  heading: "payment",
  initialValues: { payment: {} },
  Component: PaymentInformation,
  pageSchema,
};
