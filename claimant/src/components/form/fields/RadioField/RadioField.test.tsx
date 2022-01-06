import { act, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";

import { RadioField } from "./RadioField";
import { noop } from "../../../../testUtils/noop";

const radioOptions = [
  {
    label: "First",
    value: "first",
  },
  {
    label: "Second",
    value: "second",
  },
  {
    label: "Third",
    value: "third",
  },
];

describe("RadioField component", () => {
  it("renders the elements that make up a field", () => {
    const { getByLabelText } = render(
      <Formik initialValues={{ radioField: undefined }} onSubmit={noop}>
        <RadioField id="radioField" name="radioField" options={radioOptions} />
      </Formik>
    );

    const firstOption = getByLabelText("First");
    const secondOption = getByLabelText("Second");
    const thirdOption = getByLabelText("Third");

    expect(firstOption).toBeInstanceOf(HTMLInputElement);
    expect(firstOption).toHaveAttribute("id", "radioField.first");
    expect(firstOption).toHaveAttribute("name", "radioField");
    expect(firstOption).toHaveAttribute("value", "first");

    expect(secondOption).toBeInstanceOf(HTMLInputElement);
    expect(secondOption).toHaveAttribute("id", "radioField.second");
    expect(secondOption).toHaveAttribute("name", "radioField");
    expect(secondOption).toHaveAttribute("value", "second");

    expect(thirdOption).toBeInstanceOf(HTMLInputElement);
    expect(thirdOption).toHaveAttribute("id", "radioField.third");
    expect(thirdOption).toHaveAttribute("name", "radioField");
    expect(thirdOption).toHaveAttribute("value", "third");
  });

  describe("uses initial values", () => {
    it("uses the initial value that is passed", () => {
      const { getByLabelText } = render(
        <Formik initialValues={{ radioField: "second" }} onSubmit={noop}>
          <RadioField
            id="radioField"
            name="radioField"
            options={radioOptions}
          />
        </Formik>
      );

      const firstOption = getByLabelText("First");
      const secondOption = getByLabelText("Second");
      const thirdOption = getByLabelText("Third");

      expect(firstOption).not.toBeChecked();
      expect(secondOption).toBeChecked();
      expect(thirdOption).not.toBeChecked();
    });
  });

  describe("disabled", () => {
    it("disables the RadioField when it is disabled", () => {
      const { queryAllByRole } = render(
        <Formik initialValues={{ radioField: "second" }} onSubmit={noop}>
          <RadioField
            id="radioField"
            name="radioField"
            options={radioOptions}
            disabled
          />
        </Formik>
      );

      queryAllByRole("radio").map((radioOption) =>
        expect(radioOption).toBeDisabled()
      );
    });

    /**
     *  We don't currently have this use case, but it seems common enough that we
     *  should add it as necessary. This TODO should serve as a reminder that the
     *  functionality does not exist at the moment.
     *  Likely allow props specific to an option, like `disabled`, to be passed
     *  via IRadioOption when defining the options.
     */
    it.todo("is possible to disable a subset of radio options");
  });

  describe("user interaction", () => {
    it("allows the user to make a single selection", async () => {
      const { getByLabelText } = render(
        <Formik initialValues={{ radioField: undefined }} onSubmit={noop}>
          <RadioField
            id="radioField"
            name="radioField"
            options={radioOptions}
          />
        </Formik>
      );

      const firstOption = getByLabelText("First");
      const secondOption = getByLabelText("Second");
      const thirdOption = getByLabelText("Third");

      // Initially undefined, no radio should be selected
      expect(firstOption).not.toBeChecked();
      expect(secondOption).not.toBeChecked();
      expect(thirdOption).not.toBeChecked();

      // Select an option
      await act(async () => {
        userEvent.click(thirdOption);
      });

      // Only that option should be checked
      expect(firstOption).not.toBeChecked();
      expect(secondOption).not.toBeChecked();
      expect(thirdOption).toBeChecked();

      // Select a different option
      await act(async () => {
        userEvent.click(firstOption);
      });

      // Only that option should be checked
      expect(firstOption).toBeChecked();
      expect(secondOption).not.toBeChecked();
      expect(thirdOption).not.toBeChecked();
    });
  });
});
