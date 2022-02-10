import React from "react";
import { render, waitFor } from "@testing-library/react";
import { useField, useFormikContext } from "formik"; // package will be auto mocked

import TextField from "./TextField";
import userEvent from "@testing-library/user-event";

// mock out formik hook as we are not testing formik
// needs to be before first describe
jest.mock("formik");
const mockUseField = useField as typeof useField & jest.Mock;
const mockUseFormikContext = useFormikContext as typeof useFormikContext &
  jest.Mock;

describe("TextField component", () => {
  beforeEach(() => {
    mockUseFormikContext.mockReturnValue({ submitCount: 0 });
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

    mockUseField.mockReturnValue([mockField, mockMeta]);

    const { queryByText, queryByLabelText } = render(
      <TextField
        name="firstName"
        label="First Name"
        type="text"
        id="firstName"
      />
    );

    expect(queryByText("First Name")).toBeInstanceOf(HTMLLabelElement);
    expect(queryByLabelText("First Name")).toBeInstanceOf(HTMLInputElement);
    expect(queryByLabelText("First Name")).toHaveAttribute("name", "firstName");
    expect(queryByLabelText("First Name")).toHaveAttribute("id", "firstName");
  });

  it("passes a custom className prop to the input element", () => {
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
    mockUseField.mockReturnValue([mockField, mockMeta]);

    const { queryByLabelText } = render(
      <TextField
        name="firstName"
        className="myCustomInputClass"
        label="First Name"
        type="text"
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

      mockUseField.mockReturnValue([mockField, mockMeta]);

      const { queryByText } = render(
        <TextField
          name="firstName"
          label="First Name"
          type="text"
          id="firstName"
        />
      );
      expect(queryByText("First Name")).not.toHaveClass("usa-label--error");
      expect(queryByText("This field is required")).not.toBeInTheDocument();
    });

    it("shows the error message if the form is submitted", () => {
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

      mockUseFormikContext.mockReturnValue({ submitCount: 1 });
      mockUseField.mockReturnValue([mockField, mockMeta]);

      const { queryByText } = render(
        <TextField
          name="firstName"
          label="First Name"
          type="text"
          id="firstName"
        />
      );

      expect(queryByText("First Name")).toHaveClass("usa-label--error");
      expect(queryByText("This field is required")).toBeInTheDocument();
    });
  });

  describe("error styling", () => {
    beforeEach(() => {
      mockUseFormikContext.mockReturnValue({ submitCount: 1 });
    });
    describe("without prefix or suffix", () => {
      it("shows appropriate error styling", async () => {
        const mockMeta = {
          touched: true,
          error: "There's an error!",
          initialError: "There's an error!",
          initialTouched: true,
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
        mockUseField.mockReturnValue([mockField, mockMeta]);

        const { getByLabelText } = render(
          <TextField
            name="firstName"
            label="First Name"
            type="text"
            id="firstName"
          />
        );

        const textField = getByLabelText("First Name");

        expect(textField).toHaveClass("usa-input--error");

        userEvent.click(textField);
        await waitFor(() => {
          expect(textField).toHaveFocus();
          expect(textField).not.toHaveClass("usa-input--error");
        });
      });
    });
    describe("with prefix or suffix", () => {
      it("shows appropriate error styling", async () => {
        const mockMeta = {
          touched: true,
          error: "There's an error!",
          initialError: "There's an error!",
          initialTouched: true,
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
        mockUseField.mockReturnValue([mockField, mockMeta]);

        const { getByTestId, getByLabelText } = render(
          <TextField
            name="firstName"
            label="First Name"
            type="text"
            id="firstName"
            inputPrefix={"SomePrefix"}
          />
        );

        const inputGroup = getByTestId("firstName-input-group");
        const textField = getByLabelText("First Name");

        expect(inputGroup).toHaveClass("usa-input-group--error");

        userEvent.click(textField);
        await waitFor(() => {
          expect(textField).toHaveFocus();
          expect(inputGroup).not.toHaveClass("usa-input-group--error");
          expect(inputGroup).toHaveClass("is-focused");
        });
      });
    });
  });

  afterEach(jest.resetAllMocks);
});
