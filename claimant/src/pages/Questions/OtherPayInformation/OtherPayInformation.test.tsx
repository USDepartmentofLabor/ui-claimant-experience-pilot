import { render, screen } from "@testing-library/react";
import { Formik } from "formik";
import OtherPayInformation from "./OtherPayInformation";
import { noop } from "../../../testUtils/noop";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("OtherPayInformation page", () => {
  it("renders as expected", () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPayInformation />
      </Formik>
    );
    expect(
      screen.getByRole("group", { name: "pay_type.label" })
    ).toBeInTheDocument();
  });
});
