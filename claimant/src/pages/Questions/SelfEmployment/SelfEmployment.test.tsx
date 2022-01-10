import { render, screen, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import { SelfEmployment } from "./SelfEmployment";
import { noop } from "../../../testUtils/noop";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("SelfEmployment Page", () => {
  beforeEach(() => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <SelfEmployment />
      </Formik>
    );
  });
  it("renders", async () => {
    expect(
      await screen.findByText("self_employment.label")
    ).toBeInTheDocument();
  });
  it("shows fields conditionally", async () => {
    const yesButtons = screen.getAllByLabelText("yes");
    const getNameOfBusiness = () =>
      screen.queryByLabelText("business_name.label", {
        exact: false,
      });
    const getNameOfCorp = () =>
      screen.queryByLabelText("corporation_name.label", {
        exact: false,
      });
    expect(getNameOfBusiness()).not.toBeInTheDocument();
    userEvent.click(yesButtons[1]);
    await waitFor(() => {
      expect(getNameOfBusiness()).toBeInTheDocument();
    });
    expect(getNameOfCorp()).not.toBeInTheDocument();
    userEvent.click(yesButtons[2]);
    await waitFor(() => {
      expect(getNameOfCorp()).toBeInTheDocument();
    });
  });
});
