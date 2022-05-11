import React from "react";
import { render } from "@testing-library/react";
import { Formik } from "formik";

import { CheckboxField } from "./CheckboxField";
import { noop } from "../../../../testUtils/noop";

describe("CheckboxField component", () => {
  it("renders the elements that make up a field", () => {
    const { getByText, getByLabelText } = render(
      <Formik initialValues={{}} onSubmit={noop}>
        <CheckboxField name="checkboxField" label="checkboxField" />
      </Formik>
    );

    expect(getByText("checkboxField")).toBeInstanceOf(HTMLLabelElement);
    expect(getByLabelText("checkboxField")).toHaveAttribute(
      "name",
      "checkboxField"
    );
    expect(getByLabelText("checkboxField")).toHaveAttribute(
      "id",
      "checkboxField"
    );
  });

  describe("uses initial values", () => {
    it("uses the initial value that is passed", () => {
      const initialValues = {
        checkboxField: true,
      };

      const { getByLabelText } = render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <CheckboxField name="checkboxField" label="checked" />
        </Formik>
      );
      expect(getByLabelText("checked")).toBeChecked();
    });
  });

  describe("disabled", () => {
    it("disables the checkbox when it is disabled", () => {
      const { getByLabelText } = render(
        <Formik initialValues={{}} onSubmit={noop}>
          <CheckboxField name="checkboxField" label="checkboxField" disabled />
        </Formik>
      );

      expect(getByLabelText("checkboxField")).toBeDisabled();
    });
  });

  afterEach(jest.resetAllMocks);
});
