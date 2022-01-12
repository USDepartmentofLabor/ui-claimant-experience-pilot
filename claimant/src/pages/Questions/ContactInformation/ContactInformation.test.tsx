import { render, within } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { ContactInformation } from "./ContactInformation";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("ContactInformation component", () => {
  const initialValues = {
    interpreter_required: undefined,
    preferred_language: "",
  };

  it("renders properly", () => {
    const { getByLabelText, getByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <ContactInformation />
      </Formik>
    );

    const interpreterField = getByRole("group", {
      name: "contact_information.interpreter_required.label",
    });
    const interpreterYes = within(interpreterField).getByLabelText("yes");
    const interpreterNo = within(interpreterField).getByLabelText("no");
    expect(interpreterYes).toHaveAttribute("id", "interpreter_required.yes");
    expect(interpreterNo).toHaveAttribute("id", "interpreter_required.no");

    const preferredLanguageField = getByLabelText(
      "contact_information.preferred_language.label"
    );
    expect(preferredLanguageField).toHaveValue(
      initialValues.preferred_language
    );
  });
});
