import React from "react";
import { render } from "@testing-library/react";
import { useField, useFormikContext } from "formik"; // package will be auto mocked

import TextAreaField from "./TextAreaField";

// mock out formik hook as we are not testing formik
// needs to be before first describe
jest.mock("formik");

describe("TextAreaField component", () => {
  beforeEach(() => {
    useFormikContext.mockReturnValue({ submitCount: 0 });
  });

  it("renders the elements that make up a field", () => {
    const mockMeta = {
      touched: false,
      error: "",
      initialError: "",
      initialTouched: false,
      initialValue: "",
      value: "",
    };
    const mockField = {
      value: "",
      checked: false,
      onChange: jest.fn(),
      onBlur: jest.fn(),
      multiple: undefined,
      name: "firstName",
    };

    useField.mockReturnValue([mockField, mockMeta]);

    const { queryByText, queryByLabelText } = render(
      <TextAreaField name="firstName" label="First Name" id="firstName" />
    );

    expect(queryByText("First Name")).toBeInstanceOf(HTMLLabelElement);
    expect(queryByLabelText("First Name")).toBeInstanceOf(HTMLTextAreaElement);
    expect(queryByLabelText("First Name")).toHaveAttribute("name", "firstName");
    expect(queryByLabelText("First Name")).toHaveAttribute("id", "firstName");
  });

  it("passes a custom className prop to the input element", () => {
    useField.mockReturnValue([{}, {}]);

    const { queryByLabelText } = render(
      <TextAreaField
        name="firstName"
        className="myCustomInputClass"
        label="First Name"
        id="firstName"
      />
    );

    expect(queryByLabelText("First Name")).toHaveClass("myCustomInputClass");
  });

  describe("with an error message", () => {
    it("does not show the error message if the input is untouched", () => {
      const mockMeta = {
        touched: false,
        error: "This field is required",
        initialError: "",
        initialTouched: false,
        initialValue: "",
        value: "",
      };

      const mockField = {
        value: "",
        checked: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
        multiple: undefined,
        name: "firstName",
      };

      useField.mockReturnValue([mockField, mockMeta]);

      const { queryByText } = render(
        <TextAreaField name="firstName" label="First Name" id="firstName" />
      );
      expect(queryByText("First Name")).not.toHaveClass("usa-label--error");
      expect(queryByText("This field is required")).not.toBeInTheDocument();
    });

    it("shows the error message if the input is touched", () => {
      const mockMeta = {
        touched: true,
        error: "This field is required",
        initialError: "",
        initialTouched: false,
        initialValue: "",
        value: "",
      };

      const mockField = {
        value: "",
        checked: false,
        onChange: jest.fn(),
        onBlur: jest.fn(),
        multiple: undefined,
        name: "firstName",
      };

      useField.mockReturnValue([mockField, mockMeta]);

      const { queryByText } = render(
        <TextAreaField name="firstName" label="First Name" id="firstName" />
      );

      expect(queryByText("First Name")).toHaveClass("usa-label--error");
      expect(queryByText("This field is required")).toBeInTheDocument();
    });
  });

  afterEach(jest.resetAllMocks);
});
