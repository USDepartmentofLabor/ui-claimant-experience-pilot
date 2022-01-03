import { render, within, screen } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { Formik } from "formik";
import { EmployerProfile } from "./EmployerProfile";
import userEvent from "@testing-library/user-event";

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

    const employerAddress1 = getByRole("textbox", {
      name: "address.address1.label",
    });

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
    it("displays the end date for this employer field only when NO is selected", async () => {
      render(
        <Formik initialValues={{}} onSubmit={() => undefined}>
          <EmployerProfile segment="0" />
        </Formik>
      );
      const stillWorkingField = screen.getByRole("group", {
        name: "still_working.label",
      });
      const stillWorkingNo = within(stillWorkingField).getByLabelText("no");
      const endDate = screen.queryByRole("textbox", {
        name: "last_work_date.label",
      });
      expect(endDate).toBeNull();
      await act(async () => userEvent.click(stillWorkingNo));
      expect(
        screen.getByRole("textbox", { name: "last_work_date.label" })
      ).toBeInTheDocument();
    });

    it("displays location when claimant says 'no' to working at same address as employer", async () => {
      render(
        <Formik initialValues={{}} onSubmit={() => undefined}>
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
      await act(async () => userEvent.click(sameAddressNo));
      expect(
        screen.getByRole("group", { name: "work_site_address.heading" })
      ).toBeInTheDocument();
    });
    it("displays work site phone field when user chooses 'no' to same phone number", async () => {
      render(
        <Formik initialValues={{}} onSubmit={() => undefined}>
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
      await act(async () => userEvent.click(sameAddressNo));
      expect(
        screen.getByRole("textbox", { name: "alt_employer_phone" })
      ).toBeInTheDocument();
    });
  });
});
