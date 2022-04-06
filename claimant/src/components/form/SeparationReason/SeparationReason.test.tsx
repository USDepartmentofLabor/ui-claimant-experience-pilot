import { ComponentProps } from "react";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import { SeparationReason } from "./SeparationReason";
import { noop } from "../../../testUtils/noop";
import { EMPLOYER_SKELETON } from "../../../utils/claim_form";
import { Trans } from "react-i18next";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ children }: ComponentProps<typeof Trans>) => <>{children}</>,
}));

describe("SeparationReason component", () => {
  const initialValues = {
    employers: [{ ...EMPLOYER_SKELETON }],
  };

  it("renders properly", () => {
    const { getByTestId, getAllByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <SeparationReason segment="0" disabled={false} />
      </Formik>
    );

    const reasonRadios = getAllByRole("radio");
    expect(reasonRadios.length).toEqual(7);

    const laidOff = getByTestId("employers[0].separation_reason.laid_off");
    const stillEmployed = getByTestId(
      "employers[0].separation_reason.still_employed"
    );
    expect(laidOff).not.toBeChecked();
    expect(laidOff).toHaveAttribute("name", "employers[0].separation_reason");
    expect(stillEmployed).not.toBeChecked();
    expect(stillEmployed).toHaveAttribute(
      "name",
      "employers[0].separation_reason"
    );
  });

  it("displays conditional secondary set of radios", async () => {
    const { getByTestId, getAllByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <SeparationReason segment="0" disabled={false} />
      </Formik>
    );

    const laidOff = getByTestId("employers[0].separation_reason.laid_off");
    const stillEmployed = getByTestId(
      "employers[0].separation_reason.still_employed"
    );
    expect(laidOff).not.toBeChecked();

    userEvent.click(laidOff);
    await waitFor(() => {
      expect(laidOff).toBeChecked();
    });
    let reasonRadios = getAllByRole("radio");
    expect(reasonRadios.length).toEqual(11);

    userEvent.click(stillEmployed);
    await waitFor(() => {
      expect(stillEmployed).toBeChecked();
    });
    reasonRadios = getAllByRole("radio");
    expect(reasonRadios.length).toEqual(17);

    userEvent.click(laidOff);
    await waitFor(() => {
      expect(laidOff).toBeChecked();
    });
    reasonRadios = getAllByRole("radio");
    expect(reasonRadios.length).toEqual(11);
  });

  it("disables fields", () => {
    const { getByTestId, getByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <SeparationReason segment="0" disabled />
      </Formik>
    );

    expect(
      getByTestId("employers[0].separation_reason.laid_off")
    ).toBeDisabled();
    expect(getByRole("textbox")).toBeDisabled();
  });
});
