import React from "react";
import { render } from "@testing-library/react";
import { Formik } from "formik";
import DropdownField from "./DropdownField";
import { noop } from "../../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("dropdownField component", () => {
  it("renders the elements that make up a field", () => {
    const { getByText, getByLabelText } = render(
      <Formik initialValues={{}} onSubmit={noop}>
        <DropdownField
          name="dropdownField"
          label="dropdownField"
          id="dropdownField"
          options={[
            { label: "label1", value: "value1" },
            { label: "label2", value: "value2" },
          ]}
        />
      </Formik>
    );

    expect(getByText("dropdownField")).toBeInstanceOf(HTMLLabelElement);
    expect(getByLabelText("dropdownField")).toHaveAttribute(
      "name",
      "dropdownField"
    );
    expect(getByLabelText("dropdownField")).toHaveAttribute(
      "id",
      "dropdownField"
    );
  });

  describe("uses initial values", () => {
    it("uses the initial value that is passed", () => {
      const initialValues = {
        dropdownField: "value2",
      };

      const { getByLabelText } = render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <DropdownField
            name="dropdownField"
            label="dropdownField"
            id="dropdownField"
            options={[
              { label: "label1", value: "value1" },
              { label: "label2", value: "value2" },
            ]}
          />
        </Formik>
      );
      expect(getByLabelText("dropdownField")).toHaveValue("value2");
    });
  });

  describe("disabled", () => {
    it("disables the dropdown when it is disabled", () => {
      const { getByLabelText } = render(
        <Formik initialValues={{}} onSubmit={noop}>
          <DropdownField
            name="dropdownField"
            label="dropdownField"
            id="dropdownField"
            options={[
              { label: "label1", value: "value1" },
              { label: "label2", value: "value2" },
            ]}
            disabled
          />
        </Formik>
      );

      expect(getByLabelText("dropdownField")).toBeDisabled();
    });
  });
});
