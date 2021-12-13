import { act, render } from "@testing-library/react";
import { Formik } from "formik";

import { ClaimantNames } from "./ClaimantNames";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("ClaimantNames component", () => {
  it("renders properly", () => {
    const claimantName = "claimant_name";
    const alternateNames = "alternate_names";
    const initialValues = {
      [claimantName]: {
        first_name: "",
        middle_name: "",
        last_name: "",
      },
      [alternateNames]: [],
    };

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClaimantNames />
      </Formik>
    );

    const claimantFirstNameField = getByLabelText("label.first_name");
    const claimantMiddleNameField = getByLabelText("label.middle_name");
    const claimantLastNameField = getByLabelText("label.last_name");

    expect(claimantFirstNameField).toHaveValue("");
    expect(claimantFirstNameField).toHaveAttribute(
      "id",
      `${claimantName}.first_name`
    );
    expect(claimantFirstNameField).toHaveAttribute(
      "name",
      `${claimantName}.first_name`
    );

    expect(claimantMiddleNameField).toHaveValue("");
    expect(claimantMiddleNameField).toHaveAttribute(
      "id",
      `${claimantName}.middle_name`
    );
    expect(claimantMiddleNameField).toHaveAttribute(
      "name",
      `${claimantName}.middle_name`
    );

    expect(claimantLastNameField).toHaveValue("");
    expect(claimantLastNameField).toHaveAttribute(
      "id",
      `${claimantName}.last_name`
    );
    expect(claimantLastNameField).toHaveAttribute(
      "name",
      `${claimantName}.last_name`
    );
  });

  it("renders toggles alternate_names on via radio button control", async () => {
    const claimantName = "claimant_name";
    const alternateNames = "alternate_names";
    const initialValues = {
      [claimantName]: {
        first_name: "",
        middle_name: "",
        last_name: "",
      },
      [alternateNames]: [],
    };

    const { getByRole, getAllByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClaimantNames />
      </Formik>
    );

    await act(async () => userEvent.click(getByRole("radio", { name: "Yes" })));

    const [claimantFirstNameField, claimantAlternateFirstNameField] =
      getAllByLabelText("label.first_name");
    const [claimantMiddleNameField, claimantAlternateMiddleNameField] =
      getAllByLabelText("label.middle_name");
    const [claimantLastNameField, claimantAlternateLastNameField] =
      getAllByLabelText("label.last_name");

    expect(claimantFirstNameField).toHaveValue("");
    expect(claimantFirstNameField).toHaveAttribute(
      "id",
      `${claimantName}.first_name`
    );
    expect(claimantFirstNameField).toHaveAttribute(
      "name",
      `${claimantName}.first_name`
    );

    expect(claimantMiddleNameField).toHaveValue("");
    expect(claimantMiddleNameField).toHaveAttribute(
      "id",
      `${claimantName}.middle_name`
    );
    expect(claimantMiddleNameField).toHaveAttribute(
      "name",
      `${claimantName}.middle_name`
    );

    expect(claimantLastNameField).toHaveValue("");
    expect(claimantLastNameField).toHaveAttribute(
      "id",
      `${claimantName}.last_name`
    );
    expect(claimantLastNameField).toHaveAttribute(
      "name",
      `${claimantName}.last_name`
    );

    expect(claimantAlternateFirstNameField).toHaveValue("");
    expect(claimantAlternateFirstNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.first_name`
    );
    expect(claimantAlternateFirstNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.first_name`
    );

    expect(claimantAlternateMiddleNameField).toHaveValue("");
    expect(claimantAlternateMiddleNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.middle_name`
    );
    expect(claimantAlternateMiddleNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.middle_name`
    );

    expect(claimantAlternateLastNameField).toHaveValue("");
    expect(claimantAlternateLastNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.last_name`
    );
    expect(claimantAlternateLastNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.last_name`
    );
  });
});
