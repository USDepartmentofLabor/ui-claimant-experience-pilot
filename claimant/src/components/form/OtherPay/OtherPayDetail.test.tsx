import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import OtherPayDetail from "./OtherPayDetail";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("OtherPayDetail component", () => {
  it("renders as expected", () => {
    const props = {
      name: "paid_time_off",
      label: "Paid Time Off",
      description: "I am your salvation",
    };
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <OtherPayDetail {...props} />
      </Formik>
    );

    expect(
      screen.getByRole("spinbutton", {
        name: `other_pay_detail.total.label`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", {
        name: `other_pay_detail.date_received.label`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: `other_pay_detail.note.label`,
      })
    ).toBeInTheDocument();
  });

  it("user can type into fields", async () => {
    const props = {
      name: "bonus",
      label: "Bonus",
    };
    render(
      <Formik
        initialValues={{ total: "", date_received: "", note: "" }}
        onSubmit={noop}
      >
        <OtherPayDetail {...props} />
      </Formik>
    );

    const totalField = screen.getByRole("spinbutton", {
      name: "other_pay_detail.total.label",
    });
    const dateGroup = screen.getByRole("group", {
      name: "other_pay_detail.date_received.label",
    });
    const monthField = within(dateGroup).getByRole("textbox", {
      name: "date.month.label",
    });
    const dayField = within(dateGroup).getByRole("textbox", {
      name: "date.day.label",
    });
    const yearField = within(dateGroup).getByRole("textbox", {
      name: "date.year.label",
    });

    const noteField = screen.getByRole("textbox", {
      name: `other_pay_detail.note.label`,
    });

    userEvent.type(totalField, "5000");
    userEvent.clear(monthField);
    userEvent.type(monthField, "08");
    userEvent.clear(dayField);
    userEvent.type(dayField, "15");
    userEvent.clear(yearField);
    userEvent.type(yearField, "2020");
    userEvent.type(noteField, "I did an extra favor");

    await act(async () => {
      expect(totalField).toHaveValue(5000);
      expect(monthField).toHaveValue("08");
      expect(dayField).toHaveValue("15");
      expect(yearField).toHaveValue("2020");
      expect(noteField).toHaveValue("I did an extra favor");
    });
  });
});
