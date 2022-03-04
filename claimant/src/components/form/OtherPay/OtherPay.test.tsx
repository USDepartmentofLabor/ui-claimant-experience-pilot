import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";

import OtherPay from "./OtherPay";
import { noop } from "../../../testUtils/noop";
import {
  getInvalidClaimFormFixtures,
  getValidClaimFormFixtures,
} from "../../../testUtils/fixtures";
import { useTranslation } from "react-i18next";
import { OtherPayInformationPage } from "../../../pages/Questions/OtherPayInformation/OtherPayInformation";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("OtherPay", () => {
  it("renders properly", async () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );
    await waitFor(() => {
      expect(
        screen.getByRole("group", { name: "pay_type.label" })
      ).toBeInTheDocument();
    });
  });

  it("opens additional fields based on pay type selection", async () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );

    const payTypeGroup = screen.getByRole("group", { name: "pay_type.label" });
    const pto = within(payTypeGroup).getByText(
      "pay_type.options.vacation_sick_pto.label"
    );
    const severance = within(payTypeGroup).getByText(
      "pay_type.options.severance.label"
    );
    userEvent.click(pto);
    userEvent.click(severance);

    await act(async () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.vacation_sick_pto.label",
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.severance.label",
        })
      ).toBeInTheDocument();
    });

    // input is given a value
    const [, severanceNoteField] = screen.getAllByRole("textbox", {
      name: "other_pay_detail.note.label",
    });

    userEvent.type(severanceNoteField, "hello world");
    await act(async () => {
      expect(severanceNoteField).toHaveValue("hello world");
    });

    // unchecking pay type removes the pay detail fields
    userEvent.click(severance);
    await act(async () => {
      expect(
        screen.getByRole("heading", {
          level: 2,
          name: "pay_type.options.vacation_sick_pto.label",
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: "pay_type.options.severance.label",
        })
      ).not.toBeInTheDocument();
    });

    // field value should be cleared when clicking again
    userEvent.click(severance);
    await act(async () => {
      const [, severanceNoteField] = screen.getAllByRole("textbox", {
        name: "other_pay_detail.note.label",
      });
      expect(severanceNoteField).toHaveValue("");
    });
  });

  it("removes and disables all other options when 'no other pay' is selected", async () => {
    const initialValues = {
      other_pay: [
        {
          pay_type: "vacation",
          total: 3000,
          note: "I had a few days of vacation left",
        },
        {
          pay_type: "severance",
          total: 500,
          note: "They paid a small severance",
        },
      ],
    };

    render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );

    const payTypeGroup = screen.getByRole("group", { name: "pay_type.label" });
    const vacation = within(payTypeGroup).getByRole("checkbox", {
      name: "pay_type.options.vacation_sick_pto.label pay_type.options.vacation_sick_pto.description",
    });
    const severance = within(payTypeGroup).getByRole("checkbox", {
      name: "pay_type.options.severance.label pay_type.options.severance.description",
    });

    const noOtherPay = within(payTypeGroup).getByText(
      "pay_type.options.no_other_pay.label"
    );

    expect(vacation).toBeEnabled();
    expect(severance).toBeEnabled();

    userEvent.click(noOtherPay);

    await act(async () => {
      screen.debug();
      expect(vacation).toBeDisabled();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: "pay_type.options.vacation.label",
        })
      ).not.toBeInTheDocument();
      expect(severance).toBeDisabled();
      expect(
        screen.queryByRole("heading", {
          level: 2,
          name: "pay_type.options.severance.label",
        })
      ).not.toBeInTheDocument();
    });
  });

  it("orders the order pay detail fields by order of checkboxes", async () => {
    render(
      <Formik initialValues={{ other_pay: [] }} onSubmit={noop}>
        <OtherPay />
      </Formik>
    );

    const payTypeGroup = screen.getByRole("group", { name: "pay_type.label" });
    const pto = within(payTypeGroup).getByText(
      "pay_type.options.vacation_sick_pto.label"
    );
    const severance = within(payTypeGroup).getByText(
      "pay_type.options.severance.label"
    );
    const other = within(payTypeGroup).getByText(
      "pay_type.options.other.label"
    );

    userEvent.click(severance);
    userEvent.click(pto);
    userEvent.click(other);

    await act(async () => {
      const payDetails = screen.getAllByRole("heading", { level: 2 });
      expect(payDetails).toHaveLength(3);
      expect(payDetails[0]).toHaveTextContent("vacation_sick_pto");
      expect(payDetails[1]).toHaveTextContent("severance");
      expect(payDetails[2]).toHaveTextContent("other");
    });
  });

  describe("validations", () => {
    describe("valid answers", () => {
      it.concurrent.each(getValidClaimFormFixtures("other-pay"))(
        "passes with valid values: %o",
        (formData) => {
          const { t } = useTranslation("claimForm");
          const schema = OtherPayInformationPage.pageSchema(t);

          expect(schema.isValidSync(formData)).toBeTruthy();
        }
      );
    });

    describe("invalid answers", () => {
      it.concurrent.each(getInvalidClaimFormFixtures("other-pay"))(
        "fails with invalid values: %o",
        (formData) => {
          const { t } = useTranslation("claimForm");
          const schema = OtherPayInformationPage.pageSchema(t);

          expect(schema.isValidSync(formData)).toBeFalsy();
        }
      );
    });
  });
});
