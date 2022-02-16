import { act, render, screen, within } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import { EducationVocationalRehab } from "./EducationVocationalRehab";
import claimForm from "../../../i18n/en/claimForm";
import userEvent from "@testing-library/user-event";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

describe("EducationVocationalRehab component", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <EducationVocationalRehab />
      </Formik>
    );

    const legends = [
      "education_vocational_rehab.education.full_time_student.label",
      "education_vocational_rehab.education.attending_training.label",
      "education_vocational_rehab.vocational_rehab.is_registered.label",
    ];

    legends.forEach((legend) => {
      expect(screen.getByText(legend)).toBeInTheDocument();
    });

    const educationLevelDropdown = screen.getByLabelText(
      `education_level.label`
    );
    expect(educationLevelDropdown).toBeInTheDocument();
    Object.keys(claimForm.education_level.options).forEach((educationLevel) => {
      within(educationLevelDropdown).getByText(
        `education_level.options.${educationLevel}`
      );
    });
  });

  describe("education level", () => {
    it("Allows selection of an education level", async () => {
      render(
        <Formik initialValues={{}} onSubmit={noop}>
          <EducationVocationalRehab />
        </Formik>
      );

      const educationLevelDropdown = screen.getByLabelText(
        "education_level.label"
      );
      expect(educationLevelDropdown).toHaveValue("");

      await act(async () => {
        await userEvent.click(educationLevelDropdown);
        await userEvent.selectOptions(educationLevelDropdown, "none");
      });
      expect(educationLevelDropdown).toHaveValue("none");

      await act(async () => {
        userEvent.selectOptions(educationLevelDropdown, "grade_12");
      });
      expect(educationLevelDropdown).toHaveValue("grade_12");
      expect(educationLevelDropdown).not.toHaveValue("none");
    });
  });
});
