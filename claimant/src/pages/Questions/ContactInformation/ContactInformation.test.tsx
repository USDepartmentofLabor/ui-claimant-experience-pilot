import { act, render, waitFor, within } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { ContactInformation } from "./ContactInformation";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("ContactInformation component", () => {
  const initialValues = {
    email: undefined,
    phones: [],
    LOCAL_more_phones: undefined,
    interpreter_required: undefined,
    preferred_language: "",
  };

  it("renders properly", () => {
    const { getByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <ContactInformation />
      </Formik>
    );

    const interpreterField = getByRole("group", {
      name: "interpreter_required.label",
    });
    const interpreterYes = within(interpreterField).getByLabelText("yes");
    const interpreterNo = within(interpreterField).getByLabelText("no");
    expect(interpreterYes).toHaveAttribute("id", "interpreter_required.yes");
    expect(interpreterNo).toHaveAttribute("id", "interpreter_required.no");

    const phoneOne = getByRole("textbox", { name: "phone.number.label" });
    expect(phoneOne).toHaveAttribute("id", "phones[0].number");

    const email = getByRole("textbox", { name: "email" });
    expect(email).toHaveAttribute("id", "email");
    expect(email).toHaveAttribute("readonly", "");
    expect(email).toHaveAttribute("disabled", "");
  });

  it("displays alternate phone fields", async () => {
    const { getAllByRole, getByRole } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <ContactInformation />
      </Formik>
    );
    const morePhones = getByRole("checkbox", { name: "more_phones" });
    expect(morePhones).not.toBeChecked();

    await act(async () => {
      userEvent.click(morePhones);
    });

    const [phone1, phone2] = getAllByRole("textbox", {
      name: "phone.number.label",
    });
    expect(phone1).toHaveAttribute("id", "phones[0].number");
    expect(phone2).toHaveAttribute("id", "phones[1].number");

    await waitFor(() => {
      expect(phone1).toHaveValue("");
      expect(phone1).toHaveAttribute("name", `phones[0].number`);

      expect(phone2).toHaveValue("");
      expect(phone2).toHaveAttribute("name", `phones[1].number`);
    });

    userEvent.click(morePhones);

    await waitFor(() => {
      expect(phone2).not.toBeInTheDocument();
    });
  });

  it("conditionally displays preferred language", async () => {
    const { getByRole, getByLabelText, queryByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <ContactInformation />
      </Formik>
    );

    const interpreterField = getByRole("group", {
      name: "interpreter_required.label",
    });
    const interpreterYes = within(interpreterField).getByLabelText("yes");
    const interpreterNo = within(interpreterField).getByLabelText("no");
    expect(interpreterYes).toHaveAttribute("id", "interpreter_required.yes");
    expect(interpreterNo).toHaveAttribute("id", "interpreter_required.no");
    expect(queryByLabelText("preferred_language.label")).toBeNull();

    userEvent.click(interpreterYes);

    await waitFor(() => {
      expect(getByLabelText("preferred_language.label")).toBeInTheDocument();
    });

    userEvent.click(interpreterNo);

    await waitFor(() => {
      expect(queryByLabelText("preferred_language.label")).toBeNull();
    });
  });
});
