import { act, render, screen, waitFor, within } from "@testing-library/react";
import { Formik } from "formik";
import { noop } from "../../../testUtils/noop";
import {
  EducationVocationalRehab,
  EducationVocationalRehabPage,
} from "./EducationVocationalRehab";
import claimForm from "../../../i18n/en/claimForm";
import userEvent from "@testing-library/user-event";
import {
  getInvalidClaimFormFixtures,
  getValidClaimFormFixtures,
} from "../../../testUtils/fixtures";
import { useTranslation } from "react-i18next";

jest.mock("react-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
  Trans: ({ i18nKey }: { i18nKey: string }) => <>{i18nKey}</>,
}));

describe("EducationVocationalRehab component", () => {
  it("renders properly", () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <EducationVocationalRehab />
      </Formik>
    );

    const legends = [
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

  it("shows/hides training type", async () => {
    render(
      <Formik initialValues={{}} onSubmit={noop}>
        <EducationVocationalRehab />
      </Formik>
    );

    const currentlyAttendingTrainingFormGroup = screen.getByRole("group", {
      name: "education_vocational_rehab.education.attending_training.label",
    });
    const currentlyAttendingTrainingYes = within(
      currentlyAttendingTrainingFormGroup
    ).getByText("yes");
    const currentlyAttendingTrainingNo = within(
      currentlyAttendingTrainingFormGroup
    ).getByText("no");

    expect(
      screen.queryByRole("group", {
        name: "education_vocational_rehab.education.training_type.label",
      })
    ).not.toBeInTheDocument();

    userEvent.click(currentlyAttendingTrainingYes);

    const trainingTypeFormGroup = await screen.findByRole("group", {
      name: "education_vocational_rehab.education.training_type.label",
    });

    Object.keys(
      claimForm.education_vocational_rehab.education.training_type.options
    ).forEach((trainingType) => {
      expect(
        within(trainingTypeFormGroup).getByText(
          `education_vocational_rehab.education.training_type.options.${trainingType}`
        )
      );
    });

    userEvent.click(currentlyAttendingTrainingNo);

    await waitFor(() => {
      expect(trainingTypeFormGroup).not.toBeInTheDocument();
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
        userEvent.selectOptions(educationLevelDropdown, "high_school_ged");
      });
      expect(educationLevelDropdown).toHaveValue("high_school_ged");
      expect(educationLevelDropdown).not.toHaveValue("none");
    });
  });

  describe("validations", () => {
    describe("valid answers", () => {
      it.concurrent.each(
        getValidClaimFormFixtures("education-vocational-rehab")
      )("passes with valid values: %o", (formData) => {
        const { t } = useTranslation("claimForm");
        const schema = EducationVocationalRehabPage.pageSchema(t);

        expect(schema.isValidSync(formData)).toBeTruthy();
      });
    });

    describe("invalid answers", () => {
      it.concurrent.each(
        getInvalidClaimFormFixtures("education-vocational-rehab")
      )("fails with invalid values: %o", (formData) => {
        const { t } = useTranslation("claimForm");
        const schema = EducationVocationalRehabPage.pageSchema(t);

        expect(schema.isValidSync(formData)).toBeFalsy();
      });
    });
  });
});
