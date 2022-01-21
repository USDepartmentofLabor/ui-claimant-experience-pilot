import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PaymentInformation } from "./PaymentInformation";
import { Formik } from "formik";
import claimForm from "../../../i18n/en/claimForm";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("PaymentInformation page", () => {
  it("renders as expected", () => {
    const initialValues = {
      payment_method: {},
    };
    render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <PaymentInformation />
      </Formik>
    );

    Object.keys(claimForm.payment.payment_method.options).map((option) => {
      const paymentMethodRadio = screen.getByRole("radio", {
        name: `payment_method.options.${option}`,
      });
      expect(paymentMethodRadio).not.toBeChecked();
    });
  });

  it("shows fields conditional upon direct deposit selection", async () => {
    const initialValues = {
      payment_method: {},
    };
    render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <PaymentInformation />
      </Formik>
    );

    userEvent.click(
      screen.getByRole("radio", {
        name: "payment_method.options.direct_deposit",
      })
    );

    await act(async () => {
      Object.keys(claimForm.payment.account_type.options).map((option) => {
        const accountTypeRadio = screen.getByRole("radio", {
          name: `account_type.options.${option}`,
        });
        expect(accountTypeRadio).not.toBeChecked();
      });

      expect(screen.getByLabelText("routing_number.label")).toBeInTheDocument();
      expect(
        screen.getByLabelText("re_enter_routing_number.label")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("account_number.label")).toBeInTheDocument();
      expect(
        screen.getByLabelText("re_enter_account_number.label")
      ).toBeInTheDocument();
    });
    // check that values get cleared when debit is chosen
    userEvent.click(
      screen.getByRole("radio", {
        name: "payment_method.options.debit",
      })
    );
    userEvent.click(
      screen.getByRole("radio", {
        name: "payment_method.options.direct_deposit",
      })
    );
    await act(async () => {
      expect(
        screen.getByRole("group", { name: "account_type.label" })
      ).toHaveFormValues({});
      expect(
        screen.getByRole("textbox", { name: "routing_number.label" })
      ).toHaveValue("");
      expect(
        screen.getByRole("textbox", { name: "re_enter_routing_number.label" })
      ).toHaveValue("");
      expect(
        screen.getByRole("textbox", { name: "account_number.label" })
      ).toHaveValue("");
      expect(
        screen.getByRole("textbox", { name: "re_enter_account_number.label" })
      ).toHaveValue("");
    });
  });
});
