import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { DisabilityStatus } from "./DisabilityStatus";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("DisabilityStatus component", () => {
  it("renders properly", async () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <DisabilityStatus />
      </Formik>
    );

    // Shows initial question
    expect(
      screen.getByText("disability.has_collected_disability.label")
    ).toBeInTheDocument();

    const additionalQuestionLabels = [
      "disability.disabled_immediately_before.label",
      "disability.type_of_disability.label",
      "disability.date_disability_began.label",
      "disability.recovery_date.label",
    ];

    // Doesn't show additional questions yet
    additionalQuestionLabels.forEach((field) => {
      expect(screen.queryByText(field)).not.toBeInTheDocument();
    });

    const hasCollectedDisabilityYes = screen.getByLabelText("yes");
    userEvent.click(hasCollectedDisabilityYes);

    // Shows additional questions
    additionalQuestionLabels.forEach((field) => {
      expect(screen.getByText(field)).toBeInTheDocument();
    });

    const recoveryDateField = screen.getByLabelText(
      "disability.recovery_date.label"
    );

    const contactEmployerLabel =
      "disability.contact_employer_after_recovering.label";

    // Doesn't show final conditional question yet
    expect(screen.queryByText(contactEmployerLabel)).not.toBeInTheDocument();

    userEvent.type(recoveryDateField, "2020-01-01");

    // Shows final conditional question
    await waitFor(() => {
      expect(screen.getByText(contactEmployerLabel)).toBeInTheDocument();
    });
  });
});
