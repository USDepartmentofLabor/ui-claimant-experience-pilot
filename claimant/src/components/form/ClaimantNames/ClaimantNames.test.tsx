import { render } from "@testing-library/react";
import { Formik } from "formik";

import { ClaimantNames } from "./ClaimantNames";

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
      [alternateNames]: [
        {
          first_name: "",
          middle_name: "",
          last_name: "",
        },
      ],
    };

    const { getAllByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={() => undefined}>
        <ClaimantNames />
      </Formik>
    );

    const [claimantFirstNameField, claimantOtherFirstNameField] =
      getAllByLabelText("label.first_name");
    const [claimantMiddleNameField, claimantOtherMiddleNameField] =
      getAllByLabelText("label.middle_name");
    const [claimantLastNameField, claimantOtherLastNameField] =
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

    expect(claimantOtherFirstNameField).toHaveValue("");
    expect(claimantOtherFirstNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.first_name`
    );
    expect(claimantOtherFirstNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.first_name`
    );

    expect(claimantOtherMiddleNameField).toHaveValue("");
    expect(claimantOtherMiddleNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.middle_name`
    );
    expect(claimantOtherMiddleNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.middle_name`
    );

    expect(claimantOtherLastNameField).toHaveValue("");
    expect(claimantOtherLastNameField).toHaveAttribute(
      "id",
      `${alternateNames}.0.last_name`
    );
    expect(claimantOtherLastNameField).toHaveAttribute(
      "name",
      `${alternateNames}.0.last_name`
    );
  });
});
