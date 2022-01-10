import { render, within } from "@testing-library/react";
import { Formik } from "formik";
import { EmployerInformation } from "./EmployerInformation";
import { noop } from "../../../testUtils/noop";
import { ComponentProps } from "react";
import { Trans } from "react-i18next";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ children }: ComponentProps<typeof Trans>) => <>{children}</>,
}));

describe("EmployerInformation Page", () => {
  it("renders properly", () => {
    const { getByRole } = render(
      <Formik
        initialValues={{ employers: [{ ...EMPLOYER_SKELETON }] }}
        onSubmit={noop}
      >
        <EmployerInformation segment={undefined} />
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
