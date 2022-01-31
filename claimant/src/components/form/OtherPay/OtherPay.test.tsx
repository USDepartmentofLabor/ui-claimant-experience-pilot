import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";

import OtherPay from "./OtherPay";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("OtherPay", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );
    expect(
      screen.getByRole("group", { name: "pay_type.label" })
    ).toBeInTheDocument();
  });

  it("opens additional fields based on pay type selection", async () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );

    const payTypeGroup = screen.getByRole("group", { name: "pay_type.label" });
    const pto = within(payTypeGroup).getByText(
      "pay_type.options.paid_time_off.label"
    );
    const severance = within(payTypeGroup).getByText(
      "pay_type.options.severance.label"
    );
    userEvent.click(pto);
    userEvent.click(severance);

    await act(async () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.paid_time_off.label",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.severance.label",
        })
      ).toBeInTheDocument();
    });

    // input is given a value
    const [, severanceNoteField] = screen.getAllByRole("textbox", {
      name: "other_pay_detail.note.label",
    });

    userEvent.type(severanceNoteField, "hello world");
    await act(async () => {
      expect(severanceNoteField).toHaveValue("hello world");
    });

    // unchecking pay type removes the pay detail fields
    userEvent.click(severance);
    await act(async () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.paid_time_off.label",
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: "pay_type.options.severance.label",
        })
      ).not.toBeInTheDocument();
    });

    // field value should be cleared when clicking again
    userEvent.click(severance);
    await act(async () => {
      const [, severanceNoteField] = screen.getAllByRole("textbox", {
        name: "other_pay_detail.note.label",
      });
      expect(severanceNoteField).toHaveValue("");
    });
  });

  it("orders the order pay detail fields by order of checkboxes", async () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );

    const payTypeGroup = screen.getByRole("group", { name: "pay_type.label" });
    const pto = within(payTypeGroup).getByText(
      "pay_type.options.paid_time_off.label"
    );
    const severance = within(payTypeGroup).getByText(
      "pay_type.options.severance.label"
    );
    const other = within(payTypeGroup).getByText(
      "pay_type.options.other.label"
    );

    userEvent.click(severance);
    userEvent.click(pto);
    userEvent.click(other);

    await act(async () => {
      const payDetails = screen.getAllByRole("heading", { level: 2 });
      expect(payDetails).toHaveLength(3);
      expect(payDetails[0]).toHaveTextContent("paid_time_off");
      expect(payDetails[1]).toHaveTextContent("severance");
      expect(payDetails[2]).toHaveTextContent("other");
    });
  });
});
