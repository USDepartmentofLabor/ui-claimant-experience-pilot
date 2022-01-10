import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
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
      <Formik
        initialValues={{}}
        onSubmit={() => {
          return;
        }}
      >
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
