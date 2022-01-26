import { ComponentProps } from "react";
import { render, waitFor, within, screen } from "@testing-library/react";
import { Formik } from "formik";
import { EmployerProfile } from "./EmployerProfile";
import userEvent from "@testing-library/user-event";
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

describe("EmployerProfile component", () => {
  const initialValues = {
    employers: [{ ...EMPLOYER_SKELETON }],
  };

  it("renders properly", () => {
    const { getByLabelText, getByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <EmployerProfile segment="0" />
      </Formik>
    );

    const employerNameField = getByLabelText("name.label");
    const employerAddress1 = getByRole("textbox", {
      name: "address.address1.label",
    });

    expect(employerNameField).toHaveValue("");
    expect(employerNameField).toHaveAttribute("id", "employers[0].name");
    expect(employerNameField).toHaveAttribute("name", "employers[0].name");

    expect(employerAddress1).toHaveAttribute(
      "id",
      "employers[0].address.address1"
    );
    expect(
      screen.getByRole("textbox", { name: "phones.number.label" })
    ).toHaveAttribute("id", "employers[0].phones[0].number");
    expect(screen.getByRole("textbox", { name: "fein.label" })).toHaveAttribute(
      "id",
      "employers[0].fein"
    );
  });

  describe("hidden fields appear upon particular boolean selection", () => {
    it("displays location when claimant says 'no' to working at same address as employer", async () => {
      render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <EmployerProfile segment="0" />
        </Formik>
      );
      const sameAddressField = screen.getByRole("group", {
        name: "same_address.label",
      });
      const sameAddressNo = within(sameAddressField).getByLabelText(
        "no_different_address"
      );

      expect(
        screen.queryByRole("group", { name: "work_site_address.heading" })
      ).toBeNull();
      userEvent.click(sameAddressNo);
      await waitFor(() => {
        expect(
          screen.getByRole("group", { name: "work_site_address.heading" })
        ).toBeInTheDocument();
      });
    });

    it("displays work location phone field when user chooses 'no' to same phone number", async () => {
      render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <EmployerProfile segment="0" />
        </Formik>
      );
      const samePhoneField = screen.getByRole("group", {
        name: "same_phone.label",
      });
      const sameAddressNo =
        within(samePhoneField).getByLabelText("no_different_phone");

      expect(
        screen.queryByRole("textbox", { name: "alt_employer_phone" })
      ).toBeNull();
      userEvent.click(sameAddressNo);
      await waitFor(() => {
        expect(
          screen.getByRole("textbox", { name: "alt_employer_phone" })
        ).toBeInTheDocument();
      });
    });
  });

  it("displays last date field when laid_off separation reason is selected", async () => {
    const { getByTestId, getByLabelText, queryByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <EmployerProfile segment="0" />
      </Formik>
    );
    const laidOff = getByTestId("employers[0].separation_reason.laid_off");
    const firstDateWorked = getByLabelText("first_work_date.label");
    const lastDateWorked = queryByLabelText("last_work_date.label");
    expect(laidOff).not.toBeChecked();
    expect(firstDateWorked).toBeInTheDocument();
    expect(lastDateWorked).toEqual(null);

    userEvent.click(laidOff);
    await waitFor(() => {
      expect(laidOff).toBeChecked();
      expect(getByLabelText("last_work_date.label")).toBeInTheDocument();
    });
  });

  it("hides last date field when still_employed separation reason is selected", async () => {
    const { getByTestId, getByLabelText, queryByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <EmployerProfile segment="0" />
      </Formik>
    );
    const stillEmployed = getByTestId(
      "employers[0].separation_reason.still_employed"
    );
    const firstDateWorked = getByLabelText("first_work_date.label");
    const lastDateWorked = queryByLabelText("last_work_date.label");
    expect(stillEmployed).not.toBeChecked();
    expect(firstDateWorked).toBeInTheDocument();
    expect(lastDateWorked).toEqual(null);

    userEvent.click(stillEmployed);
    await waitFor(() => {
      expect(stillEmployed).toBeChecked();
      expect(queryByLabelText("last_work_date.label")).toEqual(null);
    });
  });
});
