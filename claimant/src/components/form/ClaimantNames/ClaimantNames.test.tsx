import { render, waitFor } from "@testing-library/react";
import { Formik } from "formik";

import { ClaimantNames } from "./ClaimantNames";
import userEvent from "@testing-library/user-event";
import { noop } from "../../../testUtils/noop";
import { PERSON_NAME_SKELETON } from "../../../utils/claim_form";

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
        ...PERSON_NAME_SKELETON,
      },
      [alternateNames]: [],
    };

    const { getByLabelText } = render(
      <Formik initialValues={initialValues} onSubmit={noop}>
        <ClaimantNames />
      </Formik>
    );

    const claimantFirstNameField = getByLabelText("name.first_name.label");
    const claimantMiddleNameField = getByLabelText("name.middle_name.label");
    const claimantLastNameField = getByLabelText("name.last_name.label");

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

  describe("alternate names", () => {
    it("fields are toggled via radio button control", async () => {
      const claimantName = "claimant_name";
      const alternateNames = "alternate_names";
      const initialValues = {
        [claimantName]: {
          ...PERSON_NAME_SKELETON,
        },
        [alternateNames]: [],
      };

      const { getByRole, getAllByLabelText } = render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <ClaimantNames />
        </Formik>
      );

      const yesAlternateNames = getByRole("radio", { name: "yes" });
      const noAlternateNames = getByRole("radio", { name: "no" });

      userEvent.click(yesAlternateNames);

      const [claimantFirstNameField, claimantAlternateFirstNameField] =
        getAllByLabelText("name.first_name.label");
      const [claimantMiddleNameField, claimantAlternateMiddleNameField] =
        getAllByLabelText("name.middle_name.label");
      const [claimantLastNameField, claimantAlternateLastNameField] =
        getAllByLabelText("name.last_name.label");

      await waitFor(() => {
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

      userEvent.click(noAlternateNames);

      await waitFor(() => {
        expect(claimantAlternateFirstNameField).not.toBeInTheDocument();
        expect(claimantAlternateMiddleNameField).not.toBeInTheDocument();
        expect(claimantAlternateLastNameField).not.toBeInTheDocument();
      });
    });

    it("fields are cleared when toggled", async () => {
      const claimantName = "claimant_name";
      const alternateNames = "alternate_names";
      const initialValues = {
        [claimantName]: {
          ...PERSON_NAME_SKELETON,
        },
        [alternateNames]: [],
      };

      const { getByRole, queryAllByLabelText } = render(
        <Formik initialValues={initialValues} onSubmit={noop}>
          <ClaimantNames />
        </Formik>
      );

      const yesAlternateNames = getByRole("radio", { name: "yes" });
      const noAlternateNames = getByRole("radio", { name: "no" });

      // Toggle on
      userEvent.click(yesAlternateNames);

      const claimantAlternateFirstNameField = queryAllByLabelText(
        "name.first_name.label"
      )[1];
      const claimantAlternateMiddleNameField = queryAllByLabelText(
        "name.middle_name.label"
      )[1];
      const claimantAlternateLastNameField = queryAllByLabelText(
        "name.last_name.label"
      )[1];

      await waitFor(() => {
        expect(claimantAlternateFirstNameField).toBeInTheDocument();
        expect(claimantAlternateMiddleNameField).toBeInTheDocument();
        expect(claimantAlternateLastNameField).toBeInTheDocument();
      });

      userEvent.type(claimantAlternateFirstNameField, "This");
      userEvent.type(claimantAlternateMiddleNameField, "Should");
      userEvent.type(claimantAlternateLastNameField, "Clear");

      await waitFor(() => {
        expect(claimantAlternateFirstNameField).toHaveValue("This");
        expect(claimantAlternateMiddleNameField).toHaveValue("Should");
        expect(claimantAlternateLastNameField).toHaveValue("Clear");
      });

      // Toggle off
      userEvent.click(noAlternateNames);

      await waitFor(() => {
        expect(claimantAlternateFirstNameField).not.toBeInTheDocument();
        expect(claimantAlternateMiddleNameField).not.toBeInTheDocument();
        expect(claimantAlternateLastNameField).not.toBeInTheDocument();
      });

      // Toggle back on
      userEvent.click(yesAlternateNames);

      await waitFor(() => {
        const claimantAlternateFirstNameField = queryAllByLabelText(
          "name.first_name.label"
        )[1];
        const claimantAlternateMiddleNameField = queryAllByLabelText(
          "name.middle_name.label"
        )[1];
        const claimantAlternateLastNameField = queryAllByLabelText(
          "name.last_name.label"
        )[1];

        expect(claimantAlternateFirstNameField).toBeInTheDocument();
        expect(claimantAlternateMiddleNameField).toBeInTheDocument();
        expect(claimantAlternateLastNameField).toBeInTheDocument();

        expect(claimantAlternateFirstNameField).toHaveValue("");
        expect(claimantAlternateMiddleNameField).toHaveValue("");
        expect(claimantAlternateLastNameField).toHaveValue("");
      });
    });
  });
});
