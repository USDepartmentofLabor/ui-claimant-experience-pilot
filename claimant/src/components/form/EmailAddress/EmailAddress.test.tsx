import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { EmailAddress } from "./EmailAddress";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("EmailAddress", () => {
  beforeEach(() => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <EmailAddress />
      </Formik>
    );
  });

  it("renders properly", () => {
    expect(screen.getByLabelText("label.email_address")).toBeInTheDocument();
    expect(
      screen.getByLabelText("label.confirm_email_address")
    ).toBeInTheDocument();
  });
});
