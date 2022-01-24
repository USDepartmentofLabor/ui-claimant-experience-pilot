import { render, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import { DateInputField } from "./DateInputField";
import { noop } from "../../../../testUtils/noop";
import * as yup from "yup";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("DateInputField Component", () => {
  it("renders the elements that make up the field", () => {
    const { getByLabelText } = render(
      <Formik initialValues={{ dateInputField: "" }} onSubmit={noop}>
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    expect(monthField).toBeInstanceOf(HTMLInputElement);
    expect(monthField).toHaveAttribute("id", "dateInputField.month");
    expect(monthField).toHaveAttribute("name", "dateInputField.month");
    expect(monthField).toHaveValue("");

    expect(dayField).toBeInstanceOf(HTMLInputElement);
    expect(dayField).toHaveAttribute("id", "dateInputField.day");
    expect(dayField).toHaveAttribute("name", "dateInputField.day");
    expect(dayField).toHaveValue("");

    expect(yearField).toBeInstanceOf(HTMLInputElement);
    expect(yearField).toHaveAttribute("id", "dateInputField.year");
    expect(yearField).toHaveAttribute("name", "dateInputField.year");
    expect(yearField).toHaveValue("");
  });

  it("renders a hint", () => {
    const { queryByText } = render(
      <Formik initialValues={{ dateInputField: "" }} onSubmit={noop}>
        <DateInputField
          id={"dateInputField"}
          name={"dateInputField"}
          hint="Here's a clue!"
        />
      </Formik>
    );

    const hint = queryByText("Here's a clue!");

    expect(hint).toBeInTheDocument();
    expect(hint).toHaveClass("usa-hint");
  });

  it("accepts and parses an initial value properly", () => {
    const { getByLabelText } = render(
      <Formik initialValues={{ dateInputField: "1885-10-13" }} onSubmit={noop}>
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    expect(monthField).toHaveValue("10");
    expect(dayField).toHaveValue("13");
    expect(yearField).toHaveValue("1885");
  });

  it("Displays an error when the field is touched and blurred", async () => {
    const { getByLabelText, queryByRole } = render(
      <Formik
        initialValues={{ dateInputField: "" }}
        validationSchema={yup.object().shape({
          dateInputField: yup.date().required(),
        })}
        onSubmit={noop}
      >
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    // Focus the month input
    userEvent.click(monthField);
    await waitFor(() => {
      expect(monthField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab to the day input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab to the year input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab away from the year field, blurs the entire field and triggers validation as a result
    userEvent.tab();
    await waitFor(() => {
      expect(monthField).not.toHaveFocus();
      expect(dayField).not.toHaveFocus();
      expect(yearField).not.toHaveFocus();

      expect(queryByRole("alert")).toBeInTheDocument();
    });
  });

  it("Allows the user to enter a date", async () => {
    const { getByLabelText, queryByRole } = render(
      <Formik
        initialValues={{ dateInputField: "" }}
        validationSchema={yup.object().shape({
          dateInputField: yup.date().required(),
        })}
        onSubmit={noop}
      >
        <DateInputField id={"dateInputField"} name={"dateInputField"} />
      </Formik>
    );

    const monthField = getByLabelText("date.month.label");
    const dayField = getByLabelText("date.day.label");
    const yearField = getByLabelText("date.year.label");

    // Focus the month input
    userEvent.type(monthField, "01");
    await waitFor(() => {
      expect(monthField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    // Tab to the day input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(dayField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    userEvent.type(dayField, "01");

    // Tab to the year input of the field
    userEvent.tab();
    await waitFor(() => {
      expect(yearField).toHaveFocus();
      expect(queryByRole("alert")).not.toBeInTheDocument();
    });

    userEvent.type(yearField, "2000");

    // Tab away from the year field, blurs the entire field. No Error should be present
    userEvent.tab();
    await waitFor(() => {
      expect(monthField).not.toHaveFocus();
      expect(dayField).not.toHaveFocus();
      expect(yearField).not.toHaveFocus();

      expect(monthField).toHaveValue("01");
      expect(dayField).toHaveValue("01");
      expect(yearField).toHaveValue("2000");

      expect(queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
