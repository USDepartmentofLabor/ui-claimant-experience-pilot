import { render, within } from "@testing-library/react";
import { Formik } from "formik";
import { EmployerProfile } from "./EmployerProfile";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("EmployerProfile component", () => {
  it("renders properly", () => {
    const { getByLabelText, getByRole } = render(
      <Formik initialValues={{}} onSubmit={() => undefined}>
        <EmployerProfile segment="0" />
      </Formik>
    );

    const employerNameField = getByLabelText("name.label");
    const stillWorkingField = getByRole("group", {
      name: "still_working.label",
    });
    const stillWorkingYes = within(stillWorkingField).getByLabelText("yes");
    const stillWorkingNo = within(stillWorkingField).getByLabelText("no");

    expect(employerNameField).toHaveValue("");
    expect(employerNameField).toHaveAttribute("id", "employers[0].name");
    expect(employerNameField).toHaveAttribute("name", "employers[0].name");

    expect(stillWorkingYes).toHaveAttribute(
      "id",
      "employers[0].LOCAL_still_working.yes"
    );
    expect(stillWorkingNo).toHaveAttribute(
      "id",
      "employers[0].LOCAL_still_working.no"
    );
  });
});
