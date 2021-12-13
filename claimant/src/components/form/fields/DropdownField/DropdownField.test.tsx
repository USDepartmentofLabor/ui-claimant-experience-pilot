import React from "react";
import { render } from "@testing-library/react";
import { Formik } from "formik";
import DropdownField from "./DropdownField";

describe("dropdownField component", () => {
  it("renders the elements that make up a field", () => {
    const { getByText, getByLabelText } = render(
      <Formik>
        <DropdownField
          name="dropdownField"
          label="dropdownField"
          id="dropdownField"
          options={[
            { label: "label1", id: "id1" },
            { label: "label2", id: "id2" },
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
        dropdownField: "id2",
      };

      const { getByLabelText } = render(
        <Formik initialValues={initialValues}>
          <DropdownField
            name="dropdownField"
            label="dropdownField"
            id="dropdownField"
            options={[
              { label: "label1", id: "id1" },
              { label: "label2", id: "id2" },
            ]}
          />
        </Formik>
      );
      expect(getByLabelText("dropdownField")).toHaveValue("id2");
    });
  });

  describe("disabled", () => {
    it("disables the dropdown when it is disabled", () => {
      const { getByLabelText } = render(
        <Formik>
          <DropdownField
            name="dropdownField"
            label="dropdownField"
            id="dropdownField"
            options={[
              { label: "label1", id: "id1" },
              { label: "label2", id: "id2" },
            ]}
            disabled
          />
        </Formik>
      );

      expect(getByLabelText("dropdownField")).toBeDisabled();
    });
  });
});
