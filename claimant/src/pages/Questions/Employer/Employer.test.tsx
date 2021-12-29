import { render, within } from "@testing-library/react";
import { Formik } from "formik";
import { Employer } from "./Employer";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("Employer Page", () => {
  it("renders properly", () => {
    const { getByRole } = render(
      <Formik initialValues={{ employers: [] }} onSubmit={() => undefined}>
        <Employer segment={undefined} />
      </Formik>
    );

    const moreEmployersFieldSet = getByRole("group", {
      name: "employers.more_employers.label",
    });

    const yesMoreEmployers = within(moreEmployersFieldSet).getByRole("radio", {
      name: "yes",
    });
    const noMoreEmployers = within(moreEmployersFieldSet).getByRole("radio", {
      name: "no",
    });

    expect(moreEmployersFieldSet).toBeInTheDocument();
    expect(yesMoreEmployers).toBeInTheDocument();
    expect(noMoreEmployers).toBeInTheDocument();
  });
});
